// @ts-nocheck
/**
 * FitTrack V7 – Sincronização P2P via WebRTC DataChannel
 *
 * Fluxo:
 *   1. Dispositivo A gera uma oferta (offer) e exibe um QR code.
 *   2. Dispositivo B lê o QR code, cria uma resposta (answer) e envia de volta.
 *   3. O canal de dados é estabelecido – os dois lados trocam mensagens.
 */

export interface P2PMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'data' | 'ping' | 'pong';
  payload: any;
  from: string;
  timestamp: number;
}

export interface SyncData {
  type: 'workout' | 'plan';
  content: any; // WorkoutSession ou WorkoutPlan
  version: string;
  signature?: string; // opcional: assinatura HMAC para verificação
}

class P2PSyncManager {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private localId: string;
  private remoteId: string | null = null;
  private onDataCallback: ((data: SyncData) => void) | null = null;
  private onConnectionStateChangeCallback: ((connected: boolean) => void) | null = null;

  private iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  constructor() {
    this.localId = this.generateId();
  }

  private generateId(): string {
    return 'fittrack-' + Math.random().toString(36).substring(2, 10);
  }

  getLocalId(): string {
    return this.localId;
  }

  onData(callback: (data: SyncData) => void): void {
    this.onDataCallback = callback;
  }

  onConnectionStateChange(callback: (connected: boolean) => void): void {
    this.onConnectionStateChangeCallback = callback;
  }

  // ─── Criar oferta (dispositivo A) ─────────────────────────────────────
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    this.peerConnection = new RTCPeerConnection({ iceServers: this.iceServers });
    this.setupPeerConnection();

    // Canal de dados confiável (ordered, retransmissão)
    this.dataChannel = this.peerConnection.createDataChannel('fittrack-sync', {
      ordered: true,
      maxRetransmits: 3,
    });
    this.setupDataChannel();

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    await this.waitForIceGathering();
    return this.peerConnection.localDescription!;
  }

  // ─── Aceitar oferta (dispositivo B) ───────────────────────────────────
  async acceptOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    this.peerConnection = new RTCPeerConnection({ iceServers: this.iceServers });
    this.setupPeerConnection();

    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannel();
    };

    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    await this.waitForIceGathering();
    return this.peerConnection.localDescription!;
  }

  // ─── Completar handshake (dispositivo A após receber answer) ───────────
  async completeConnection(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    await this.peerConnection.setRemoteDescription(answer);
  }

  // ─── Adicionar candidato ICE (recebido via QR ou mensagem) ─────────────
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) throw new Error('Peer connection not initialized');
    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  // ─── Enviar dados (treino/plano) ──────────────────────────────────────
  sendData(data: SyncData): boolean {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.warn('[P2P] DataChannel not open');
      return false;
    }
    const message: P2PMessage = {
      type: 'data',
      payload: data,
      from: this.localId,
      timestamp: Date.now(),
    };
    this.dataChannel.send(JSON.stringify(message));
    return true;
  }

  // ─── Configuração da conexão ──────────────────────────────────────────
  private setupPeerConnection(): void {
    if (!this.peerConnection) return;

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Emitir evento para ser capturado pela UI e enviado ao outro peer
        window.dispatchEvent(
          new CustomEvent('p2p-ice-candidate', {
            detail: { candidate: event.candidate.toJSON() },
          }),
        );
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      const connected = this.peerConnection?.connectionState === 'connected';
      this.onConnectionStateChangeCallback?.(connected);
    };
  }

  private setupDataChannel(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      console.log('[P2P] DataChannel open');
      // Enviar ping para confirmar
      this.dataChannel?.send(
        JSON.stringify({ type: 'ping', from: this.localId, timestamp: Date.now() }),
      );
    };

    this.dataChannel.onmessage = (event) => {
      try {
        const msg: P2PMessage = JSON.parse(event.data);
        if (msg.type === 'data') {
          this.onDataCallback?.(msg.payload as SyncData);
        } else if (msg.type === 'ping') {
          this.dataChannel?.send(
            JSON.stringify({ type: 'pong', from: this.localId, timestamp: Date.now() }),
          );
        }
      } catch (err) {
        console.error('[P2P] Failed to parse message', err);
      }
    };

    this.dataChannel.onclose = () => {
      console.log('[P2P] DataChannel closed');
      this.onConnectionStateChangeCallback?.(false);
    };
  }

  private async waitForIceGathering(): Promise<void> {
    if (!this.peerConnection) return;
    if (this.peerConnection.iceGatheringState === 'complete') return;
    return new Promise((resolve) => {
      const check = () => {
        if (this.peerConnection?.iceGatheringState === 'complete') {
          this.peerConnection?.removeEventListener('icegatheringstatechange', check);
          resolve();
        }
      };
      this.peerConnection.addEventListener('icegatheringstatechange', check);
      setTimeout(resolve, 3000); // timeout de segurança
    });
  }

  // ─── Fechar conexão ───────────────────────────────────────────────────
  disconnect(): void {
    this.dataChannel?.close();
    this.peerConnection?.close();
    this.dataChannel = null;
    this.peerConnection = null;
    this.remoteId = null;
  }
}

export const p2pSync = new P2PSyncManager();
