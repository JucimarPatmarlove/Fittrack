# Security

## Reporting Security Issues

If you discover a security vulnerability in this project, please report it responsibly by emailing security@fittrack.app or opening a private vulnerability report on GitHub.

## Known Vulnerabilities

### Critical: `tar` Arbitrary File Creation/Overwrite via Hardlink Path Traversal (CVE-2024-xxxxx)

**Severity**: Critical (CVSS 9.8)  
**Package**: `tar` (<=7.5.20)  
**Introduced via**: `@capacitor/cli@6.2.2` (devDependency)  
**Affected versions**: All versions up to 7.5.20  
**Fixed in**: tar >= 7.6.0

#### Description

The `tar` package (node-tar) is vulnerable to multiple path traversal attacks that allow arbitrary file creation/overwrite, symlink poisoning, and hardlink path traversal. These vulnerabilities could allow an attacker to write files outside the intended extraction directory during tar archive extraction.

#### Why this is an accepted risk

1. **DevDependency only**: `@capacitor/cli` is a **development dependency** used only during the build process (running `capacitor sync`, `capacitor build`, etc.). It is **not bundled** into the production application runtime.

2. **No runtime exposure**: The vulnerable `tar` code only executes during local development/CI build steps when processing Capacitor asset archives. It does not run in the user's browser, on the mobile device, or on the server.

3. **Attack vector requires local access**: Exploitation would require an attacker to supply a malicious tar archive to the Capacitor CLI during a build. This is only possible if:
   - An attacker has write access to the developer's machine/CI environment
   - A compromised npm package publishes a malicious tarball
   - Supply chain attack on Capacitor's own assets

4. **Capacitor upgrade blocked by breaking changes**: Upgrading to `@capacitor/cli@8.x` (which uses tar >=7.5.3, though still affected) or `@capacitor/cli@9.x` would require:
   - **Android**: Migration to Android Gradle Plugin 8+, minimum SDK 24+, Gradle 8.x
   - **iOS**: Minimum deployment target iOS 13.0+, Xcode 15+
   - **Breaking API changes** in `@capacitor/core` v7/v8/v9
   - Full rebuild and testing of native Android/iOS projects

   Given the low exploitability of a devDependency vulnerability and the high cost of native project migration, the upgrade is deferred.

#### Mitigation

- Keep npm dependencies updated regularly (`npm audit` in CI)
- Use `npm ci` in CI/CD to ensure reproducible builds
- Verify package integrity with `npm audit signatures`
- Monitor for Capacitor releases that update tar dependency to >=7.6.0 without breaking changes

#### Tracking

- **npm audit ID**: GHSA-34x7-hfp2-rc4v (and related advisories)
- **GitHub Advisory**: https://github.com/advisories/GHSA-34x7-hfp2-rc4v
- **Decision date**: 2026-10-26
- **Next review**: Next major Capacitor release or when tar >=7.6.0 is available in compatible Capacitor version

---

### High: `@fastify/busboy` Denial of Service & CRLF Injection

**Severity**: High  
**Package**: `@fastify/busboy` (<=3.2.1)  
**Introduced via**: `@vercel/node@3.2.29` → `undici` → `@fastify/busboy`  
**Status**: No fix available without breaking `@vercel/node` upgrade to v27

### High: `path-to-regexp` ReDoS via Backtracking

**Severity**: High  
**Package**: `path-to-regexp` (4.0.0 - 6.2.2)  
**Introduced via**: `@vercel/node@3.2.29`  
**Status**: No fix available without breaking `@vercel/node` upgrade to v27

### Moderate: OpenTelemetry Core Unbounded Memory Allocation

**Severity**: Moderate  
**Package**: `@opentelemetry/core` (<2.8.0)  
**Introduced via**: Multiple OpenTelemetry packages  
**Status**: Fix requires breaking upgrade to exporter v0.300.0

## Dependency Update Policy

- **Critical/High runtime vulnerabilities**: Address immediately with patch/minor updates
- **Critical/High devDependencies**: Assess exploitability; accept risk if isolated to build environment
- **Moderate/Low**: Batch update in regular maintenance windows
- **Major version upgrades**: Require dedicated branch, full test suite, and staging deployment validation

## Security Headers

The application enforces the following security headers via middleware:

- `Content-Security-Policy`: Restricts script/style sources
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`: Limits browser feature access

## Secrets Management

- **No secrets in code**: All API keys, tokens, and credentials loaded from environment variables
- **CI/CD secrets**: Stored in GitHub Secrets / Vercel Environment Variables
- **Local development**: `.env.local` (gitignored)
- **Pre-commit hook**: Scans for accidental secret commits (see `.husky/pre-commit`)