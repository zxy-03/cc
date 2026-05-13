import * as readline from 'readline';
import { CryptoUtil } from '../src/utils/Crypto';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

const main = async () => {
  console.log('=== Environment Variable Encryption Tool ===');
  console.log('');

  let encryptionKey = process.env.ENCRYPTION_KEY;
  
  if (!encryptionKey) {
    encryptionKey = await askQuestion('Enter encryption key (or leave blank to generate a new one): ');
    if (!encryptionKey) {
      encryptionKey = CryptoUtil.generateKey();
      console.log(`Generated new encryption key: ${encryptionKey}`);
    }
  }

  const cryptoUtil = new CryptoUtil(encryptionKey);
  
  const apiKey = await askQuestion('Enter API key to encrypt: ');
  const encrypted = cryptoUtil.encrypt(apiKey);
  
  console.log('');
  console.log('Encrypted value:');
  console.log(encrypted);
  console.log('');
  console.log('Add this to your .env file and set ENCRYPTION_KEY');
  
  rl.close();
};

main().catch((error) => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});
