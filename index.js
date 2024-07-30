const express = require('express')
const mongoose = require('mongoose')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(express.static('public'))


mongoose.connect('mongodb+srv://admin:ew6ZHc9o5rXWnwaz@cluster0.jhovera.mongodb.net/Codecamp?retryWrites=true&w=majority&appName=Cluster0;')
  .then(() => {
    console.log('Databae Connected')
  })

const userSchema = new mongoose.Schema({
   name: String,
   count: Number,
   log:[ {
      description: {
         type: String
      },
      duration: {
         type: Number
      },
      date: {
         type: String
      }
   }]
})
const UserModel = mongoose.model('Users', userSchema)

const exerciseSchema = new mongoose.Schema({
    username: String,
    description: String,
    duration: Number,
    date: String,  
})

const ExerciseModel = mongoose.model('Exercise', exerciseSchema)

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users', (req, res) => {
   const {username} = req.body

   UserModel.create({
      name: username,
      count: 0,
      log: []
   })
   .then((result) => res.json({username: result.name , _id: result.id}))
   .catch((error) => console.log(error))
});

app.get('/api/users', (req,res) => {
    UserModel.find()
    .then((result) => {
        const data = result.map((item) => {
            return {
               username: item.name,
               _id: item._id
            }
        })
        res.json(data)
    })
})

app.post('/api/users/:_id/exercises',  async (req,res) => {

   const {description,duration,date} = req.body
   let obj = new Date()
   const user = await UserModel.findById({_id:req.params._id})
   const logs = user.log
  
   UserModel.findOneAndUpdate({_id:req.params._id},{
        count: user.count + 1,
        log: logs.concat([{
            description: description, 
            duration: duration,
            date: date || obj.toDateString()
          }])
   })
   .then((result)=> {
       res.json({
          username: user.name,
          description: description, 
          duration: parseInt(duration),
          date: new Date(date).toDateString() || obj.toDateString(),
          _id: user._id,
       }) 
   })
   .catch((err) => {
      console.log('error')
   })
})

app.get('/api/users/:_id/logs', async (req,res) => { 
  const {from,to,limit} = req.query
  const startDate = new Date(from)
  const endDate = new Date(to)

  console.log(startDate)
  console.log(limit)
   UserModel.findById({_id: req.params._id}).select('-__v')
   .then((result) => {

       let temp = result.log

      if(from || to || limit ){
       let newLog = result.log.filter((item) => {
          return new Date(item.date) >= startDate && new Date(item.date) <= endDate
      })

        if(newLog.length > 0){
            temp = limit > 0 ? newLog.slice(0,2) : result.log
        }else{
            temp = result.log.slice(0,limit)
        }
        
        result.log = temp
      }


      res.json(result)
 
   })
   .catch((err) => console.log(err))
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
