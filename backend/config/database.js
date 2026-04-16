const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const baseConfig = {
	username: process.env.DB_USER || 'root',
	password: process.env.DB_PASSWORD || '',
	database: process.env.DB_NAME || 'phms',
	host: process.env.DB_HOST || '127.0.0.1',
	port: Number(process.env.DB_PORT || 3306),
	dialect: 'mysql',
	logging: false,
};

module.exports = {
	development: baseConfig,
	test: { ...baseConfig, database: `${baseConfig.database}_test` },
	production: baseConfig,
};
