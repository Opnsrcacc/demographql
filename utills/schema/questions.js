let { Types, model, Schema } = require('mongoose'),
    mongooseVirtual = require('mongoose-lean-virtuals'),
    questionsSchema = new Schema({
        name: { type: String, required: true, trim: true, index: true },
        options: [],
        status: Number,
        time_Stamps: { type: Number, default: +new Date() },
        username: String,
        useremail: String,
        userId: { type: Types.ObjectId }  /* ref users */
    }, { timestamps: true, versionKey: false });
questionsSchema.virtual('fullname').get(function () {
    return this.name + ' ' + this.username;
});
questionsSchema.virtual('capitaliseFirstLetter').get(function () {
    return this.name.charAt(0).toUpperCase() + this.name.substr(1).toLowerCase();
});
questionsSchema.plugin(mongooseVirtual);
module.exports = model('questionsAnswers', questionsSchema, 'questionsAnswers');