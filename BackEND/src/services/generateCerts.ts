import * as fs from 'fs';
import * as path from 'path';
import selfsigned from 'selfsigned';

/**
 * Generate self-signed certificates for HTTPS
 * Called at server startup if certificates don't exist
 */
export function ensureCertificates(): { cert: string; key: string } | null {
  const certDir = path.join(__dirname, '../../certs');
  const certFile = path.join(certDir, 'cert.pem');
  const keyFile = path.join(certDir, 'key.pem');

  // Return existing certificates if they exist
  if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
    return {
      cert: fs.readFileSync(certFile, 'utf8'),
      key: fs.readFileSync(keyFile, 'utf8'),
    };
  }

  // Create certs directory if it doesn't exist
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }

  // Generate self-signed certificate
  const attrs = [{ name: 'commonName', value: 'localhost' }];
  const pems = selfsigned.generate(attrs, { days: 365 });

  // Save certificates to files
  fs.writeFileSync(certFile, pems.cert, 'utf8');
  fs.writeFileSync(keyFile, pems.private, 'utf8');

  console.log('✓ Generated self-signed certificates for HTTPS');

  return {
    cert: pems.cert,
    key: pems.private,
  };
}
