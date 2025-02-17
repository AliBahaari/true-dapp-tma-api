import { Injectable } from '@nestjs/common';
import * as Client from 'ssh2-sftp-client';
import * as fs from 'fs';

@Injectable()
export class SftpService {
    private sftp = new Client();

    constructor() {
        if (!this.sftp) {
            this.sftp = new Client();
        }
    }

    async uploadFile(localFilePath: string, remoteFilePath: string): Promise<void> {
        try {
            // Connect to the backup server
            await this.sftp.connect({
                host: 'ec2-40-172-185-159.me-central-1.compute.amazonaws.com', // Backup server IP or hostname
                port: 22, // SSH port
                username: 'ubuntu', // SSH username
                privateKey: fs.readFileSync('/app/keys/BkKey.pem'), // Path to your private key
            });

            // Upload the file
            await this.sftp.put(localFilePath, remoteFilePath);

            console.log(`File uploaded successfully to ${remoteFilePath}`);
        } catch (error) {
            console.error('Error uploading file:', error);
            throw new Error('Failed to upload file');
        } finally {
            // Close the SFTP connection
            await this.sftp.end();
        }
    }
}