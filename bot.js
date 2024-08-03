const fs = require('fs');
const axios = require('axios');
const readline = require('readline');
const { assertIsBroadcastTxSuccess, SigningStargateClient } = require('@cosmjs/stargate');
const { DirectSecp256k1HdWallet, coin, coins } = require('@cosmjs/proto-signing');
const chalk = require('chalk');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
function loadConfig() {
    const data = fs.readFileSync('data.txt', 'utf8');
    const config = {};
    data.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            config[key.trim()] = value.trim();
        }
    });
    
    if (config.RECIPIENT_ADDRESSES) {
        config.RECIPIENT_ADDRESSES = config.RECIPIENT_ADDRESSES.split(',').map(address => address.trim());
    } else {
        config.RECIPIENT_ADDRESSES = []; 
    }

    return config;
}
const config = loadConfig();
const {
    RPC_URL,
    REST_URL,
    ACCOUNT_ADDRESS,
    PRIVATE_KEY,
    RECIPIENT_ADDRESS,
    TRANSACTION_AMOUNT,
    MIN_BALANCE,
    FEE_AMOUNT,
    GAS_LIMIT,
    MEMO,
    VALIDATOR_ADDRESS,
    CHAIN_ID,
    CHAIN_NAME,
    MNEMONIC,
    RECIPIENT_ADDRESSES
} = config;
function printWithColor(text, color) {
    const colors = {
        RESET: chalk.reset,
        RED: chalk.red,
        GREEN: chalk.green,
        YELLOW: chalk.yellow,
        CYAN: chalk.cyan,
        MAGENTA: chalk.magenta
    };
    console.log(colors[color] ? colors[color](text) : chalk.reset(text));
}
function printBanner() {
    printWithColor('------------ADFMIDN----------------', 'MAGENTA');
    printWithColor('| Full Auto Symphony Testnet IBC  |', 'MAGENTA');
    printWithColor('-----------------------------------', 'MAGENTA');
    printWithColor('| Script From AirDropFamilyIDN    |', 'MAGENTA');
    printWithColor('-------------VIP-----------------BM', 'MAGENTA');
    console.log('');
}
function promptUser(query) {
    return new Promise(resolve => rl.question(query, resolve));
}
async function fetchBalance(address) {
    const url = `${REST_URL}/cosmos/bank/v1beta1/balances/${address}`;
    try {
        const response = await axios.get(url);
        printWithColor("--- Saldo Akun ---", 'CYAN');
        const balances = response.data.balances || [];
        if (balances.length === 0) {
            printWithColor(`Saldo tidak ditemukan untuk alamat ${address}`, 'RED');
        } else {
            balances.forEach(balance => {
                printWithColor(`Denom: ${balance.denom}, Jumlah: ${balance.amount}`, 'GREEN');
            });
        }
    } catch (error) {
        printWithColor(`Error mengambil saldo: ${error.message}`, 'RED');
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
}
async function fetchDelegations(address) {
    const url = `${REST_URL}/cosmos/staking/v1beta1/delegations/${address}`;
    try {
        const response = await axios.get(url);
        printWithColor("--- Informasi Delegasi ---", 'CYAN');
        const delegations = response.data.delegation_responses || [];
        if (delegations.length > 0) {
            delegations.forEach(delegation => {
                const delInfo = delegation.delegation || {};
                const balanceInfo = delegation.balance || {};
                
                printWithColor(`Delegator: ${delInfo.delegator_address || 'N/A'}`, 'GREEN');
                printWithColor(`Validator: ${delInfo.validator_address || 'N/A'}`, 'GREEN');
                printWithColor(`Shares: ${delInfo.shares || 'N/A'}`, 'GREEN');
                printWithColor(`Denom Saldo: ${balanceInfo.denom || 'N/A'}`, 'GREEN');
                printWithColor(`Jumlah Saldo: ${balanceInfo.amount || 'N/A'}`, 'GREEN');
                printWithColor('------------------------------', 'CYAN');
            });
        } else {
            printWithColor("Tidak ada delegasi untuk alamat ini.", 'YELLOW');
        }
    } catch (error) {
        printWithColor(`Kesalahan saat mengambil data delegasi: ${error.message}`, 'RED');
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
}
async function fetchTransactionInfo(address) {
    const url = `${REST_URL}/cosmos/tx/v1beta1/txs?order_by=2&events=message.sender=%27${address}%27&pagination.limit=5&pagination.offset=0`;
    try {
        const response = await axios.get(url);
        printWithColor("--- Informasi Transaksi ---", 'CYAN');
        printWithColor(`Data Transaksi untuk alamat ${address}:`, 'GREEN');
        
        const transactions = response.data.tx_responses || [];
        if (transactions.length > 0) {
            transactions.forEach(tx => {
                const txHash = tx.txhash || 'N/A';
                const logs = tx.logs || [];
                
                printWithColor(`Hash Transaksi: ${txHash}`, 'GREEN');
                
                logs.forEach(log => {
                    log.events.forEach(event => {
                        if (event.type === 'message') {
                            event.attributes.forEach(attr => {
                                if (attr.key === 'sender') {
                                    printWithColor(`From Address: ${attr.value}`, 'GREEN');
                                }
                                if (attr.key === 'receiver') {
                                    printWithColor(`To Address: ${attr.value}`, 'GREEN');
                                }
                                if (attr.key === 'amount') {
                                    printWithColor(`Amount: ${attr.value}`, 'GREEN');
                                }
                            });
                        }
                    });
                });
                
                printWithColor('------------------------------', 'CYAN');
            });
        } else {
            printWithColor("Tidak ada transaksi untuk alamat ini.", 'YELLOW');
        }
    } catch (error) {
        printWithColor(`Error mengambil informasi transaksi: ${error.message}`, 'RED');
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
}
async function requestFaucet(address) {
    const faucetUrl = `https://faucet.ping.pub/symphony/send/${address}`;
    try {
        const response = await axios.get(faucetUrl, {
            headers: {
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'Origin': 'https://testnet.ping.pub',
                'Referer': 'https://testnet.ping.pub/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-site'
            }
        });

        if (response.data.status === 'ok') {
            printWithColor('Claim Berhasil', 'GREEN');
        } else {
            printWithColor('Claim Gagal ' + response.data.message, 'RED');
        }
    } catch (error) {
        printWithColor('Claim Gagal: ' + (error.response ? error.response.data.message : error.message), 'RED');
    }
}
async function generateWallet() {
    try {
        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(MNEMONIC, { prefix: CHAIN_NAME });
        const [firstAccount] = await wallet.getAccounts();
        printWithColor(`Welcome : ${firstAccount.address}`, 'GREEN');
        return wallet;
    } catch (error) {
        printWithColor(`Pharse Salah : ${error.message}`, 'RED');
        throw error;
    }
}
async function fetchValidators() {
    try {
        const response = await axios.get('https://symphony-api.kleomedes.network/cosmos/staking/v1beta1/validators?pagination.limit=300&status=BOND_STATUS_BONDED');
        const validators = response.data.validators;
        return validators.map(validator => validator.operator_address);
    } catch (error) {
        printWithColor(`Error fetching validators: ${error.message}`, 'RED');
        throw error;
    }
}
async function stakeTransaction(wallet, validator) {
    try {
        const client = await SigningStargateClient.connectWithSigner(RPC_URL, wallet, {
            gasPrice: {
                denom: 'note',
                amount: '0.003' 
            },
        });

        const [firstAccount] = await wallet.getAccounts();

        const amount = coin(TRANSACTION_AMOUNT, 'note');

        printWithColor(
            `DELEGATE TOKENS ${amount.amount} note from ${firstAccount.address} to ${validator}`,
            'YELLOW'
        );

        const result = await client.delegateTokens(
            firstAccount.address,
            validator,
            amount,
            {
                amount: [{ denom: 'note', amount: FEE_AMOUNT.toString() }],
                gas: GAS_LIMIT.toString(),
            },
            MEMO
        );

        printWithColor(`DELEGATE berhasil dengan hash transaksi: ${result.transactionHash}`, 'GREEN');
    } catch (error) {
        printWithColor(`Error in stakeTransaction: ${error.message}`, 'RED');
    }
}
async function performDelegations(wallet, numDelegations) {
    const validators = await fetchValidators();
    const usedValidators = new Set();

    for (let i = 0; i < numDelegations; i++) {
        const availableValidators = validators.filter(v => !usedValidators.has(v));
        
        if (availableValidators.length === 0) {
            printWithColor('No more unique validators available.', 'RED');
            break;
        }

        const validator = availableValidators[Math.floor(Math.random() * availableValidators.length)];
        usedValidators.add(validator);

        await stakeTransaction(wallet, validator);
    }
}
async function delegateTokens(wallet, valoper) {
    const client = await SigningStargateClient.connectWithSigner(RPC_URL, wallet);

    const amountFinal = {
        denom: 'usymph',
        amount: TRANSACTION_AMOUNT,
    };

    const fee = {
        amount: [{ denom: 'usymph', amount: FEE_AMOUNT.toString() }],
        gas: GAS_LIMIT.toString(),
    };

    const result = await client.delegateTokens(
        ACCOUNT_ADDRESS,
        valoper,
        amountFinal,
        fee,
        MEMO
    );

    assertIsBroadcastTxSuccess(result);
    printWithColor(`DELEGATE  berhasil dengan hash transaksi: ${result.transactionHash}`, 'GREEN');
}
async function sendTransaction(wallet, recipient) {
    try {
        if (!isValidAddress(recipient, CHAIN_NAME)) {
            printWithColor(`alamat tidak valid untuk penerima: ${recipient}`, 'RED');
            return;
        }

        const client = await SigningStargateClient.connectWithSigner(RPC_URL, wallet, {
            gasPrice: {
                denom: 'note',
                amount: '0.003'
            },
        });

        const [firstAccount] = await wallet.getAccounts();
        const amount = coins(TRANSACTION_AMOUNT, 'note');

        printWithColor(
            `SEND ${amount[0].amount} note dari ${firstAccount.address} ke ${recipient}`,
            'YELLOW'
        );

        const result = await client.sendTokens(
            firstAccount.address,
            recipient,
            amount,
            {
                amount: [{ denom: 'note', amount: FEE_AMOUNT.toString() }],
                gas: GAS_LIMIT.toString(),
            },
            MEMO
        );

        printWithColor(`Pengiriman berhasil dengan hash transaksi: ${result.transactionHash}`, 'GREEN');
    } catch (error) {
        printWithColor(`Kesalahan saat mengirim token: ${error.message}`, 'RED');
    }
}
function isValidAddress(address, expectedPrefix) {
    return address.startsWith(expectedPrefix);
}
async function performSends(wallet, numSends) {
    if (!RECIPIENT_ADDRESSES || !Array.isArray(RECIPIENT_ADDRESSES) || RECIPIENT_ADDRESSES.length < numSends) {
        printWithColor('Jumlah pengiriman melebihi jumlah alamat yang tersedia atau RECIPIENT_ADDRESSES tidak didefinisikan.', 'RED');
        return;
    }

    const validPrefix = CHAIN_NAME;
    const validRecipients = RECIPIENT_ADDRESSES.filter(address => isValidAddress(address, validPrefix));
    
    if (validRecipients.length < numSends) {
        printWithColor('Jumlah alamat yang valid kurang dari jumlah pengiriman yang diminta.', 'RED');
        return;
    }

    const selectedRecipients = validRecipients.slice(0, numSends);

    for (const recipient of selectedRecipients) {
        await sendTransaction(wallet, recipient);
    }
}
async function main() {
    printBanner();

    const wallet = await generateWallet();
    const [firstAccount] = await wallet.getAccounts();
    const address = firstAccount.address;


    await fetchBalance(address);
    await fetchDelegations(address);
    await fetchTransactionInfo(address);

    while (true) {
        printWithColor('\nPilih opsi:', 'CYAN');
        printWithColor('1. CLAIM FAUCET', 'WHITE');
        printWithColor('2. DELEGATE TOKENS', 'WHITE');
        printWithColor('3. SEND TOKENS', 'WHITE');

        const choice = await promptUser('\nMau Jalankan Yang Mana? (1/2/3): ');

        switch (choice) {
            case '1':
                await requestFaucet(address);
                break;
            case '2':
                try {
                    const numDelegations = parseInt(await promptUser('Berapakali Mau Melakukan  delegate? :  '), 10);
                    if (isNaN(numDelegations) || numDelegations <= 0) {
                        printWithColor('Invalid number of delegations.', 'RED');
                    } else {
                        await performDelegations(wallet, numDelegations);
                    }
                } catch (error) {
                    printWithColor(`Terjadi kesalahan saat delegate: ${error.message}`, 'RED');
                }
                break;
            case '3':
                try {
                    const numSends = parseInt(await promptUser('Mau Send Ke Berapa Addres ? :  '), 10);
                    if (isNaN(numSends) || numSends <= 0) {
                        printWithColor('Jumlah pengiriman tidak valid.', 'RED');
                    } else {
                        await performSends(wallet, numSends);
                    }
                } catch (error) {
                    printWithColor(`Terjadi kesalahan: ${error.message}`, 'RED');
                }
                break;
            default:
                printWithColor('Opsi tidak valid, silakan coba lagi.', 'RED');
        }
    }
}

main();
