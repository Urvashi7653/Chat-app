const mongo = require("mongodb").MongoClient;
const express = require("express");
const app = express();
const http = require("http").Server(app);
const port = process.env.PORT || 8000;
// const client = require("socket.io").listen(4000).sockets;
const client = require("socket.io")(http);

mongo.connect("mongodb://127.0.0.1/mongochat",function(err,db){
    if(err){
        throw err;
    }
    console.log("DATABASE CONNECTED!!")

    //CONNECTING TO SOCKET.IO
    client.on("connection",function(socket){
        let chat = db.collection("chats");

        //function to send status
        sendStatus = function(s){
            socket.emit("status",s)
        }

        chat.find().limit(100).sort({_id:1}).toArray(function(err,res){
            if(err){
                throw err;
            }
            socket.emit("output",res)
        });

        socket.on("input",function(data){
            let name = data.name;
            let message = data.message;

            if(name =="" || message ==""){
                sendStatus("Please enter name and message")
            }
            else{
                chat.insert({name:name,message:message},function(){
                    client.emit("output",[data])

                    sendStatus({
                        message:"Message sent",
                        clear:true
                    });
                })
            }

        socket.on("clear",function(data){
            chat.remove({},function(){
                socket.emit("cleared");
            })
        })
        })

    })
})


http.listen(port, () => {
    console.log(`App listening on port ${port}`);
})
