"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const app_1 = require("./app");
const database_1 = require("./db/database");
const PORT = process.env.PORT || 4000;
const DB_FILE = path_1.default.join(__dirname, '../../booking.db');
const db = (0, database_1.createDatabase)(DB_FILE);
const app = (0, app_1.createApp)(db);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
