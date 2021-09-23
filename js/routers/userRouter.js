//Needs limiter though!
const express = require('express')
const router = express.Router()
const passport = require('passport')
const jwt = require('../jwt')
const {BAD_REQUEST} = require('../Messages')
const userHandler = require('../handlers/userHandler')
const { catchErrors } = require('../helpers')

// When login with password
const localAuth = async (req, res, next) => {

  passport.authenticate('local', function (err, user, info) {
    if (err) { return res.send({success: false, messages: !info ? [{type:"error", message:"System error. please try again later"}]:info.messages}); }
    if (!user) { return res.send({success: false, messages:info.messages}); }

    var accessToken = jwt.sign(user)
    res.send({success: true, accessToken})
  })(req, res, next);

}

const verify = async (req,res) => {
    const {accessToken} = req.body
    res.send({success: await jwt.allowUserAccess(accessToken)})
}


async function createUser(req,res){
    const{
        email=false,
        name=false,
        password=false,
        confirmPassword=false,
        accessToken=false
    } = req.body

    if(!(email && name && password && confirmPassword && accessToken)){return res.send(BAD_REQUEST("Invalid body request."))}
    var data = { name, email, password, confirmPassword }

    var response = await userHandler.createUser(data)

    return res.send(response)
}

router.post('/createUser', catchErrors(createUser))//TODO: protect route!
router.post('/login', catchErrors(localAuth));
router.post('/authenticate', catchErrors(verify));

module.exports = router