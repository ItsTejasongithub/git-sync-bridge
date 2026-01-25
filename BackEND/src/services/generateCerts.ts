import * as fs from 'fs';
import * as path from 'path';

/**
 * Load self-signed certificates for HTTPS
 * Certificates should be pre-generated using OpenSSL and stored in BackEND/certs/
 */
export function ensureCertificates(): { cert: string; key: string } | null {
  try {
    const certDir = path.join(__dirname, '../../certs');
    const certFile = path.join(certDir, 'cert.pem');
    const keyFile = path.join(certDir, 'key.pem');

    // Load certificates if they exist
    if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
      const cert = fs.readFileSync(certFile, 'utf8');
      const key = fs.readFileSync(keyFile, 'utf8');

      if (cert && key && cert.includes('BEGIN CERTIFICATE') && key.includes('BEGIN')) {
        console.log('✓ Loaded self-signed certificates for HTTPS');
        return { cert, key };
      }
    }

    console.error('❌ SSL certificates not found');
    console.error('Run this in BackEND directory:');
    console.error('openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes');
    return null;
  } catch (error) {
    console.error('❌ Failed to load certificates:', error);
    return null;
  }
}
