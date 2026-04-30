const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String, // null if oauth
    name: String,
    photo: String,
    oauth_provider: String // hanya google/null
});

module.exports = mongoose.model('User', userSchema);