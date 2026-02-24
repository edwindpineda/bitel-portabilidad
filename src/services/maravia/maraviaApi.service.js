const axios = require('axios');
const logger = require('../../config/logger/loggerClient.js');

const MARAVIA_API_URL = process.env.MARAVIA_API_URL || 'https://api.maravia.pe/servicio';

class MaraviaApiService {
  constructor() {
    this.client = axios.create({
      baseURL: MARAVIA_API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    });
  }

  async request(endpoint, data) {
    try {
      logger.info(`[MaraviaApi] POST ${endpoint}`);
      const response = await this.client.post(`/${endpoint}`, data);
      return response.data;
    } catch (error) {
      logger.error(`[MaraviaApi] Error en ${endpoint}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new MaraviaApiService();
