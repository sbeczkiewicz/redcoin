import * as crypto from 'crypto';
/**
 * Transaction Class to control individual transactions
 * contains only the amount of transaction and the two parties involved
 */
class Transaction {
    constructor(
        public amount: number,
        public payer: string,
        public payee: string
    ){}

    toString() {
        return JSON.stringify(this);
    }
}

/**
 * Ledger block of the previous hash, a transaction and the time at which it occurs.
 * Contains function for creating a new hash based on the current block.
 */
class Block {

    public nonce = Math.round(Math.random() * 999999999);

    constructor(
        public prevHash: string,
        public transaction: Transaction,
        public ts = Date.now()
    ) {}

    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    
    }



}

/**
 * Single instance of a array of blocks (Blockchain) to record transactions.
 */
class Chain {
    public static instance = new Chain();

    chain: Block[];

    constructor() {
        this.chain = [new Block("", new Transaction(1000, 'moneyPrinter', 'Steve'))];
    }

    get lastBlock() {
        return this.chain[this.chain.length -1];
    }

    mine(nonce: number) {
        let solution = 1;
        console.log('mining...');

        //brute force to find correct hash
        while(true) {
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();

            const attempt = hash.digest('hex');
            
            if (attempt.substr(0,4) === '0000') {
                console.log(`Solved: ${solution}`);
                return solution;
            }

            solution += 1;
        }

    }

    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());

        const isValid = verifier.verify(senderPublicKey, signature);

        if (isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }


    }

}

/**
 * 
 */
class Wallet {
    public publicKey: string;
    public privateKey: string;

    constructor() {
        const keypair =  crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem'},
            privateKeyEncoding: { type: 'pkcs8', format: 'pem'},
        });

        this.privateKey = keypair.privateKey;
        this.publicKey = keypair.publicKey;
    }

    sendMoney(amount: number, payeePublicKey: string) {
        const transaction =  new Transaction(amount, this.publicKey, payeePublicKey);
        
        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();

        const signature = sign.sign(this.privateKey);
        Chain.instance.addBlock(transaction, this.publicKey, signature);

    }

}


const Steve = new Wallet();
const jp = new Wallet();
const elliot = new Wallet();

Steve.sendMoney(50, jp.publicKey);
jp.sendMoney(23, elliot.publicKey);
elliot.sendMoney(5, jp.publicKey);

console.log(Chain.instance)
