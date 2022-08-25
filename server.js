const mongo = require("mongodb").MongoClient;
const express = require("express");
const app = express();
const http = require("http").Server(app);
const port = process.env.PORT || 4000;
const client = require("socket.io")(http,{
    cors:{
        origin:"*",
    }
});


mongo.connect('mongodb://127.0.0.1/mongochat', 
    function (err, client_cb) {
        if (err) {
            console.log(err);
        }
        console.log("DATABASE CONNECTED!!")
        var db = client_cb.db("mongochat")
        //CONNECTING TO SOCKET.IO
        client.on("connection", function (socket) {
            let chat = db.collection("chats");

            //function to send status
            sendStatus = function (s) {

                //sending status from server to client
                socket.emit("status", s)
            }

            chat.find().limit(20).sort({ _id: 1 }).toArray(function (err, res) {
                if (err) {
                    throw err;
                }
                socket.emit("output", res)
            });


            //recieving input from client
            socket.on("input", function (data) {
                let name = data.name;
                let message = data.message;

                if (name == "" || message == "") {
                    sendStatus("Please enter name and message")
                }
                else {
                    chat.insertOne({ name: name, message: message }, function () {
                        client.emit("output", [data])

                        sendStatus({
                            message: "Message sent",
                            clear: true
                        });
                    })
                }
                
                //receiving clear request from client
                socket.on("clear", function (data) {
                    chat.deleteMany({}, function () {
                        socket.emit("cleared");
                    })
                })
            })

        })
    })


http.listen(port, () => {
    console.log(`App listening on port ${port}`);
})
