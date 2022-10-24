const mongodb= require('mongodb')

const MongoClient=mongodb.MongoClient;

const state={
    db:null
}

module.exports.connect=function(done){

    const mongodbUrl=process.env.MONGO_URL;
    const dbname='retroSoles';

    MongoClient.connect(mongodbUrl,(err,data)=>{
        if(err) return done(err)
        state.db= data.db(dbname);
    })
    done();
    
}

module.exports.get=function(){
    return state.db 
}


