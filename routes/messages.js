const express = require('express')
const db = require('../db')
const ExpressError = require('../expressError')
const Message = require('../models/message')

const {ensureLoggedIn} = require('../middleware/auth')

let router = new express.Router()
/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', ensureLoggedIn, async function(req, res, next) {
    try {
        let message = await Message.get(req.params.id)
        let username = req.user.username

        if (message.to_user.username !== username && message.from_user.username !== username) {
            throw new ExpressError(`You don't have permission to read this message`, 401)
        }
        return res.json({message})
    } catch (err) {
        return next(err)
    }
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', async function(req, res, next) {
    try {

        let newMessage = await Message.create({
            from_username: req.user.username, 
            to_username: req.body.to_username,
            body: req.body.body})
        
        return res.json({message: newMessage})
        } catch (err) {
            return next(err)
        }
})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', ensureLoggedIn, async function(req, res, next) {
    try {
        let message = await Message.get(req.params.id)
        let username = req.user.username

        if (message.to_user.username !== username) {
            throw new ExpressError(`You don't have permission to change this message to read`, 401)
        }

        let readMessage = await Message.markRead(req.params.id)
        return res.json({message: readMessage})
    } catch (err) {
        return next(err)
    }
})

module.exports = router