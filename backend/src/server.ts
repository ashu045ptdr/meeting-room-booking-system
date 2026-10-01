import path from "path";
import {createApp} from "./app";
import {createDatabase} from "./database";

const PORT = process.env.PORT || 4000;
const DB_FILE = path.join(__dirname, '../../booking.db');

const db = createDatabase(DB_FILE);
const app = createApp(db);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});