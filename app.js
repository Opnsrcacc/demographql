"use strict";
/** Dependency Injection */
const express = require("express"),
    session = require("express-session"), //
    cookieParser = require("cookie-parser"),
    { DB_URL, PORT, ENV } = require('./config/config'),
    cors = require("cors"),
    { connect, connection } = require('mongoose'),
    { createServer } = require("http"),
    { hashSync, genSaltSync } = require('bcrypt-nodejs'),
    { urlencoded, json } = require('express'),
    AdminRoutes = require('./routes/adminroutess');

const { GraphQLSchema, GraphQLString, GraphQLObjectType, GraphQLNonNull, GraphQLList, GraphQLID, graphqlSync, GraphQLInputObjectType } = require('graphql');
const { graphqlHTTP } = require('express-graphql'),
    questionschema = require('./utills/schema/questions'),
    userschema = require('./utills/schema/user');
/** /Dependency Injection */


/** Socket.IO */
const app = express(); // Initializing ExpressJS
const server = createServer(app);
// Allow Cross Domain Requests

try {
    /** MongoDB Connection */
    connect(DB_URL, { useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true, useUnifiedTopology: true });
    connection.on("error", error => console.error("Error in MongoDb connection: " + error));
    connection.on("reconnected", () => console.log("Trying to reconnect!"));
    connection.on("disconnected", () => console.log("MongoDB disconnected!"));
    connection.on("connected", () => {
        /** Middleware Configuration */
        app.disable("x-powered-by");
        app.use(urlencoded({ limit: "100mb", extended: true })); // Parse application/x-www-form-urlencoded
        app.use(json({ limit: "100mb" })); // Initializing/Configuration
        app.use(cookieParser("karthikeyanSiteCookies")); // cookieParser - Initializing/Configuration cookie: {maxAge: 8000},
        app.use(session({ secret: "karthikeyanSiteCookies", resave: true, saveUninitialized: true })); // express-session - Initializing/Configuration
        app.set("view engine", "html");
        app.locals.pretty = true;
        app.use((req, res, next) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "*");
            res.header("Access-Control-Allow-Credentials", true);
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
            next();
        });
        app.use(cors({ origin: true, credentials: true }));
        /** /Middleware Configuration */

        /** Dependency Mapping */
        app.use('/admin', AdminRoutes());


        /* basic steps */
        // const sxhema = new GraphQLSchema({
        //     query: new GraphQLObjectType({
        //         name: 'myfirstgraphql',
        //         description: 'My first graphql configuration',
        //         fields: () => ({
        //             message: {
        //                 type: GraphQLString,
        //                 resolve: () => 'hello world'
        //             }
        //         })
        //     })
        // });
        // app.use('/graphql', graphqlHTTP({ graphiql: true, schema: sxhema }));

        const questionType = new GraphQLObjectType({
            name: 'getallquestions',
            fields: () => ({
                _id: { type: new GraphQLNonNull(GraphQLString) },
                name: { type: new GraphQLNonNull(GraphQLString) },
                username: { type: new GraphQLNonNull(GraphQLString) },
                userId: { type: GraphQLString },
                status: { type: GraphQLString },
                options: { type: new GraphQLList(optionstype) }
            })
        });

        const userType = new GraphQLObjectType({
            name: 'getusers',
            fields: () => ({
                name: { type: GraphQLString },
                email: { type: GraphQLString },
                _id: { type: GraphQLString },
                addedquestions: {
                    type: new GraphQLList(getquestionsbyusers),
                    resolve: async (parent) => {
                        return questionschema.find({ userId: parent._id })
                    }
                }
            })
        });

        const optionstype = new GraphQLObjectType({
            name: 'optionsdata',
            fields: () => ({
                key: { type: GraphQLString },
                value: { type: GraphQLString }
            })
        });

        const optionstypenew = new GraphQLInputObjectType({
            name: 'optionsadded',
            fields: () => ({
                key: { type: GraphQLString },
                value: { type: GraphQLString }
            })
        });

        const getquestionsbyusers = new GraphQLObjectType({
            name: 'getquestionbyuserid',
            fields: () => ({
                name: { type: GraphQLString },
                options: { type: new GraphQLList(optionstype) },
                status: { type: GraphQLString },
                userdetails: {
                    type: userType,
                    resolve: async (parent, args) => {
                        return userschema.findOne({ _id: parent.userId })
                    }
                }
            })
        });

        const getQuestions = new GraphQLObjectType({
            name: 'getquestions',
            description: 'Get a questions from DB',
            fields: () => ({
                questions: {
                    type: new GraphQLList(questionType),
                    resolve: async () => {
                        return await questionschema.find({ status: 1 })
                    }
                },
                getUsers: {
                    type: new GraphQLList(userType),
                    resolve: async () => {
                        return await userschema.find({ status: 1 })
                    }
                },
                getsingleusersbtid: {
                    type: userType,
                    args: { _id: { type: GraphQLString } },
                    resolve: async (parent, args) => {
                        return userschema.findOne({ _id: args._id })
                    }
                },
                getquestionsbyidwithuser: {
                    type: getquestionsbyusers,
                    args: { _id: { type: new GraphQLNonNull(GraphQLString) } },
                    resolve: async (parent, args) => {
                        return questionschema.findOne({ _id: args._id });
                    }
                }
            })
        })

        const mutuation = new GraphQLObjectType({
            name: 'addquestions',
            fields: {
                addusers: {
                    type: userType,
                    args: {
                        name: { type: new GraphQLNonNull(GraphQLString) },
                        email: { type: new GraphQLNonNull(GraphQLString) },
                        password: { type: new GraphQLNonNull(GraphQLString) }
                    },
                    resolve: async (parent, args) => {
                        try {
                            let adduser = new userschema({
                                name: args.name,
                                email: args.email,
                                status: 1,
                                time_Stamps: +new Date(),
                                password: hashSync(args.password, genSaltSync(8), null)
                            });
                            return await adduser.save();
                        } catch (error) {
                            return error;
                        }
                    }
                },
                adduserquestions: {
                    type: questionType,
                    args: {
                        name: { type: new GraphQLNonNull(GraphQLString) },
                        userId: { type: new GraphQLNonNull(GraphQLString) },
                        options: { type: new GraphQLList(optionstypenew) }
                    },
                    resolve: async (parent, args) => {
                        try {
                            let addquestions = new questionschema({
                                name: args.name,
                                userId: args.userId,
                                status: 1,
                                time_Stamps: +new Date(),
                                options: args.options
                            });
                            return await addquestions.save();
                        } catch (error) {
                            return error;
                        }
                    }
                }
            }
        });

        const sxhema = new GraphQLSchema({
            query: getQuestions,
            mutation: mutuation
        });

        app.use('/graphql', graphqlHTTP({ graphiql: true, schema: sxhema }));
        /** /Dependency Mapping*/

        /** HTTP Server Instance */
        server.listen(PORT, () => { console.log("Server turned on with", ENV, "mode on port", PORT); });
    });
} catch (ex) {
    console.log(ex);
}
/** /MongoDB Connection */