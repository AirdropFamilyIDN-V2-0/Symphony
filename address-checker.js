const axios = require('axios');
const fs = require('fs');

const apiUrl = 'https://symphony-api.kleomedes.network/cosmos/staking/v1beta1/validators?pagination.limit=300&status=BOND_STATUS_BONDED';

async function fetchAndSaveAddresses() {
  try {
    const response = await axios.get(apiUrl);
    if (response.status !== 200) {
      console.error('Terjadi kesalahan: Status code tidak OK', response.status);
      return;
    }
    const validators = response.data.validators;
    const addresses = validators.map(validator => validator.operator_address);

    fs.writeFileSync('list_address.txt', addresses.join(','));

    console.log('Done cek file list_address.txt');
  } catch (error) {
    console.error('eror:', error.message);
  }
}
fetchAndSaveAddresses();
