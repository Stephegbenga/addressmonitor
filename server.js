const express = require("express");
const TronWeb = require('tronweb');
const Pool = require('pg').Pool
const axios = require('axios');
const app = express();


const PORT = process.env.PORT || 8080;

// TronWeb Full Host
const fullHost = 'https://api.trongrid.io'

const tronWeb = new TronWeb({
  fullHost
});

app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());



// Database Connection 
const pool = new Pool({
  user: 'Augusto',
  host: 'weeyz-staging.cqju9mhxzvtg.us-east-1.rds.amazonaws.com',
  database: 'weeyz',
  password: 'password',
  port: 5432,
})



// Main Function to Get BNB and ETH Balance Using The Moralis Api Key
function getbalance(address, network) {
  console.log(address, network)
  var config = {
    method: 'get',
    url: `https://deep-index.moralis.io/api/v2/${address}/balance?chain=${network}`,
    headers: {
      'accept': 'application/json',
      'X-API-Key': 'FwiTSahWNTK3MErXcooKMdiXF7LDGA5FsyJ0ggkvcdYluM8ueajxpRO65HHc6oUU'
    }
  };
  const promise = axios(config)
  const dataPromise = promise.then((response) => response.data.balance)
  return dataPromise
}

// Get Balance for USDT
async function getBalance(address, id, amount) {
  try {
    // contract addresss
    // https://tronscan.org/#/contract/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
    tronWeb.setAddress('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');

    // contract addresss
    // https://tronscan.org/#/contract/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
    const contract = await tronWeb.contract().at('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');

    // wallet address
    const result = await contract.balanceOf(address).call();
    
    // console.log('The TRC20 balance is:', Number(result) / Math.pow(10, 6));
    console.log(Number(result))
    if(result != 0){
      alertme(result.weeyz_address, "USDT", result.last_balance, response)
      update(id, amount)
    }else{
      update(id, amount)
    }
  } catch (error) {
    console.log(error.message)
  }
}





// Notification Function Here
function alertme(address, network, balance) {
  console.log(`There is a new transactions\n\nWallet Address:${address}\nNetwork: ${network}\nBalance: ${balance}`)
  payload = {
    address: address,
    network: network,
    balance: balance
  }

var data = JSON.stringify(payload);
console.log(data)
var config = {
  method: 'post',
  url: 'https://staging.api.weeyz.com/api/v1/crypto_alert',
  headers: { 
    'Content-Type': 'application/json'
  },
  data : data
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});

} 







app.get("/", (req, res) => {
  res.send("Blockchain Api");
});
// UPDATE public.crypto_purchases SET balance = '20'::integer WHERE id = '1';
function update(id, amount){
  pool.query(`UPDATE public.crypto_purchases SET balance = '${id}'::integer WHERE id = '${amount}'`, (error, response) => {
    console.log(error)
    console.log(response)
  })
}


app.get("/monitor", async (req, res) => {
  res.send("Working on it")
  pool.query("SELECT id, weeyz_address, balance, payment_currency FROM public.crypto_purchases  WHERE (status = 0) ORDER BY id ASC", (error, response) => {
    console.log(response.rows)
    if (error) {
      console.log(error.message)
    }
    results = response.rows
    for (const result of results) {
      address = result.weeyz_address
      id = result.id
      // console.log(address)
      if (result.weeyz_address == null) {
        console.log("address is empty")
      }
      // If Network is ETH DO THIS
      if (result.payment_currency == 2) {
        // Get The Balance For Eth
        console.log("For Eth")
        getbalance(address, "rinkeby").then(amount => {

          if(result != 0){
            alertme(result.weeyz_address, "ETH", amount)
            update(id, amount)
          }else{
            update(id, amount)
          }
        }).catch((err) => {
          console.log(err.message)
        })
        // If Network is BSC DO THIS
      } else if (result.payment_currenct == 3) {
        // Get The Balance for BSC
        getbalance(result.weeyz_address, "bsc testnet").then(amount => {

          if(result != 0){
            alertme(result.weeyz_address, "BSC", amount)
            update(id, amount)
          }else{
            update(id, amount)
          }

        }).catch((err) => {
          console.log(err.message)
        })
        //  If  Network is USDT DO THIS
      } else if (result.payment_currency == 4) {
        // Get Balance for USDT
        getBalance(address, id);
      }

    }
  })
});


app.listen(PORT, () => {
  console.log(`Server is up and running at ${PORT}`);
});