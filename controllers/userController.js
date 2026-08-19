const User = require('../models/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cloudinary = require('../configure/cloudinary')

const signup = async (req, res) => {
    try {
        console.log(req.body)
        const users = await User.find({ email: req.body.email })
        if (users.length > 0) {
            return res.status(409).json({
                error: 'email already registered....'
            })
        }
        const hashCode = await bcrypt.hash(req.body.password, 10)
        const newUser = new User({
            channelName: req.body.channelName,
            email: req.body.email,
            description: req.body.description,
            password: hashCode
        })

        const result = await newUser.save()
        res.status(200).json({
            msg: 'account created',
            token: token,
            newUser: {
                _id: result._id,
                channelName: result.channelName
            }
        })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({
            error: err
        })
    }
}


const login = async (req, res) => {
    try {
        const users = await User.find({ email: req.body.email })
        console.log(users)
        if (users.length == 0) {
            return res.status(500).json({
                error: 'user not found'
            })
        }
        const isMatch = await bcrypt.compare(req.body.password, users[0].password)
        if (!isMatch) {
            return res.status(500).json({
                error: 'invalid password..'
            })
        }

        const token = jwt.sign({
            _id: users[0]._id,
            channelName: users[0].channelName,
            email: users[0].email
        },
            process.env.SEC_KEY,
            { expiresIn: '365d' }
        )

        res.status(200).json({
            token: token,
            channelName: users[0].channelName,
            userId: users[0]._id,
            email: users[0].email
        })

    }
    catch (err) {
        console.log(err)
        res.status(500).json({
            error: err
        })
    }
}

const subscribe = async (req, res) => {
    try {
        const channelId = req.params.channelId
        // console.log(req.headers.authorization.split(" ")[1])
        const token = req.headers.authorization.split(" ")[1]
        const tokenData = jwt.verify(token, process.env.SEC_KEY)

        if (channelId == tokenData._id) {
            return res.status(500).json({
                error: 'you cant subscribe yourself'
            })
        }

        const channel = await User.findById(channelId)

        if (channel.subscribers.includes(tokenData._id)) {
            return res.status(500).json({
                error: 'you already subscribed'
            })
        }

        channel.subscribers.push(tokenData._id)
        await channel.save()

        const user = await User.findById(tokenData._id)
        user.subscribedTo.push(channel._id)
        await user.save()
        res.status(200).json({
            success: 'subscribed'
        })


    }
    catch (err) {
        console.log(err)
        res.status(500).json({
            error: err
        })
    }
}

const unsubscribe = async (req, res) => {
    try {
        const channelId = req.params.channelId
        const token = req.headers.authorization.split(" ")[1]
        const tokenData = jwt.verify(token, process.env.SEC_KEY)

        const channel = await User.findById(channelId)
        if (!channel.subscribers.includes(tokenData._id)) {
            return res.status(500).json({
                error: 'you have not subscribed this channel'
            })
        }

        const filterData = channel.subscribers.filter(userId => userId != tokenData._id)
        channel.subscribers = filterData

        await channel.save()
        console.log(channel._id)
        const user = await User.findById(tokenData._id)
        const filterSubscribeTo = user.subscribedTo.filter(userId => userId != channelId)
        console.log(filterSubscribeTo)
        user.subscribedTo = filterSubscribeTo
        await user.save()

        res.status(200).json({
            msg: 'unsubscribed...'
        })


    }
    catch (err) {
        console.log(err)
        res.status(500).json({
            error: err
        })
    }
}


const uploadProfile = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1]
        const tokenData = jwt.verify(token, process.env.SEC_KEY)
        const user = await User.findById(tokenData._id)

        if (user.profilePicUrl) {
            await cloudinary.uploader.destroy(user.profilePicId)
        }
        const uploadedProfile = await cloudinary.uploader.upload(req.files.profile.tempFilePath)
        console.log(uploadedProfile)
        user.profilePicUrl = uploadedProfile.secure_url
        user.profilePicId = uploadedProfile.public_id

        await user.save()
        res.status(200).json({
            msg: 'profile pic updated'
        })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({

        })
    }
}


const uploadCoverProfilePic = async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1]
        const tokenData = jwt.verify(token, process.env.SEC_KEY)
        const user = await User.findById(tokenData._id)

        if (user.coverPicUrl) {
            await cloudinary.uploader.destroy(user.coverPicId)
        }
        const uploadedProfile = await cloudinary.uploader.upload(req.files.coverPic.tempFilePath)
        user.coverPicUrl = uploadedProfile.secure_url
        user.coverPicId = uploadedProfile.public_id

        await user.save()
        res.status(200).json({
            msg: 'cover pic updated'
        })
    }
    catch (err) {
        console.log(err)
        res.status(500).json({

        })
    }
}



module.exports = {
    signup,
    login,
    subscribe,
    unsubscribe,
    uploadProfile,
    uploadCoverProfilePic
}