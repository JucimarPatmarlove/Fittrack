import type { WorkoutSession } from '../db/schema';

export type WebRTCMessage =
  | { type: 'PING'; payload: { time: number } }
  | { type: 'SYNC_WORKOUT'; payload: WorkoutSession };

export class WebRTCEngine {
  private peerConnection: RTCPeerConnection;
  private dataChannel?: RTCDataChannel;
  public onMessageReceived?: (msg: WebRTCMessage) => void;
  public onConnectionStateChange?: (state: string) => void;

  constructor() {
    // Usamos stun servers públicos da Google apenas para descobrir IPs locais na rede Wi-Fi
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    this.peerConnection.onconnectionstatechange = () => {
      console.log('[WebRTC] Estado da Ligação:', this.peerConnection.connectionState);
      this.onConnectionStateChange?.(this.peerConnection.connectionState);
    };

    // Quando recebemos um Data Channel da outra máquina
    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannel();
    };
  }

  // ─── MÁQUINA A: GERA A OFERTA ───────────────────────────────────────────
  public async createOffer(): Promise<string> {
    this.dataChannel = this.peerConnection.createDataChannel('fitTrack-sync-channel');
    this.setupDataChannel();

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    // Esperar que o ICE Gathering termine para termos o SDP completo num só token
    return new Promise((resolve) => {
      if (this.peerConnection.iceGatheringState === 'complete') {
        resolve(btoa(JSON.stringify(this.peerConnection.localDescription)));
      } else {
        this.peerConnection.onicegatheringstatechange = () => {
          if (this.peerConnection.iceGatheringState === 'complete') {
            resolve(btoa(JSON.stringify(this.peerConnection.localDescription)));
          }
        };
      }
    });
  }

  // ─── MÁQUINA B: RECEBE OFERTA E GERA RESPOSTA ───────────────────────────
  public async acceptOfferAndCreateAnswer(compressedOffer: string): Promise<string> {
    const decoded = atob(compressedOffer);
    if (!decoded) throw new Error('Falha na descompressão do Token P2P (Offer)');
    const offer = JSON.parse(decoded);
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    return new Promise((resolve) => {
      if (this.peerConnection.iceGatheringState === 'complete') {
        resolve(btoa(JSON.stringify(this.peerConnection.localDescription)));
      } else {
        this.peerConnection.onicegatheringstatechange = () => {
          if (this.peerConnection.iceGatheringState === 'complete') {
            resolve(btoa(JSON.stringify(this.peerConnection.localDescription)));
          }
        };
      }
    });
  }

  // ─── MÁQUINA A: ACEITA A RESPOSTA PARA ABRIR TÚNEL ──────────────────────
  public async acceptAnswer(compressedAnswer: string): Promise<void> {
    const decoded = atob(compressedAnswer);
    if (!decoded) throw new Error('Falha na descompressão do Token P2P (Answer)');
    const answer = JSON.parse(decoded);
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  // ─── COMUNICAÇÃO ────────────────────────────────────────────────────────
  private setupDataChannel() {
    if (!this.dataChannel) return;
    this.dataChannel.onopen = () => console.log('[WebRTC] Canal P2P Aberto!');
    this.dataChannel.onmessage = (event) => {
      const msg: WebRTCMessage = JSON.parse(event.data);
      this.onMessageReceived?.(msg);
    };
  }

  public sendMessage(msg: WebRTCMessage) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(msg));
    } else {
      console.warn('[WebRTC] Canal não está aberto.');
    }
  }

  public close() {
    if (this.dataChannel) this.dataChannel.close();
    if (this.peerConnection) this.peerConnection.close();
  }
}
