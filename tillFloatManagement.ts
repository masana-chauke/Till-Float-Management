import * as fs from 'fs';

interface Item {
  description: string;
  amount: number;
}

interface Transaction {
  items: Item[];
  paid: number[];
}

interface TillState {
  till: Map<number, number>;
  tillStart: number;
}

function initializeTill(): TillState {
  const till: Map<number, number> = new Map();
  let tillStart = 0;

  const denominations: [string, number][] = [
    ['5 x R50', 50],
    ['5 x R20', 20],
    ['6 x R10', 10],
    ['12 x R5', 5],
    ['10 x R2', 2],
    ['10 x R1', 1],
  ];

  for (const [note, currency] of denominations) {
    const [numString] = note.split(' x ');
    const num = parseInt(numString);
    till.set(currency, num);
    tillStart += num * currency;
  }
  
  return { till, tillStart };
}

function calculateChange(change: number, till: Map<number, number>): string {
  if (change === 0) return 'No Change';

  const coins = Array.from(till.keys()).filter(coin => coin <= change).sort((a, b) => b - a);
  const usedCoins: number[] = [];
  let remainingChange = change;

  for (const coin of coins) {
    while (remainingChange >= coin && (till.get(coin) ?? 0) > 0) {
      usedCoins.push(coin);
      remainingChange -= coin;
      till.set(coin, (till.get(coin) || 0) - 1);
    }
  }

  if (remainingChange !== 0) {
    coins.forEach(coin => {
      till.set(coin, (till.get(coin) || 0) + (usedCoins.filter(c => c === coin).length));
    });
    return 'No Change';
  }

  return usedCoins.map(coin => `R${coin}`).join('-');
}

function processTransaction(transaction: Transaction, tillState: TillState): TillState {
  const { till, tillStart } = tillState;
  const transactionTotal = transaction.items.reduce((total, item) => total + item.amount, 0);
  const totalPaid = transaction.paid.reduce((acc, curr) => acc + curr, 0);
  const changeTotal = totalPaid - transactionTotal;
  const changeBreakdown = calculateChange(changeTotal, till);

  console.log(`R${tillStart}, R${transactionTotal}, R${totalPaid}, R${changeTotal}, ${changeBreakdown}`);

  const updatedTillStart = tillStart + transactionTotal;
  const updatedTill = new Map(till);
  transaction.items.forEach(item => {
    updatedTill.set(item.amount, (updatedTill.get(item.amount) || 0) - 1);
  });

  return { till: updatedTill, tillStart: updatedTillStart };
}

function parseInput(input: string): Transaction[] {
  return input.trim().split('\n').map(line => {
    const [itemsStr, paidStr] = line.split(',');
    const items = itemsStr.split(';').map(item => {
      const [description, amountStr] = item.trim().split(' R');
      return { description: description.trim(), amount: parseInt(amountStr) };
    });
    const paid = paidStr.split('-').map(amount => parseInt(amount.substring(1).trim()));
    return { items, paid };
  });
}

function main() {
  let tillState = initializeTill();
  const inputFile = fs.readFileSync('input.txt', 'utf8');
  const transactions = parseInput(inputFile);

  console.log('Transaction Summary:');
  console.log(`Till Start, Transaction Total, Paid, Change Total, Change Breakdown`);

  transactions.forEach(transaction => {
    const { tillStart } = tillState;
    tillState = processTransaction(transaction, tillState);
  });

  console.log(`Remaining Till Balance: R${tillState.tillStart}`);
}

main();
