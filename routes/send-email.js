// Send email
import Cosmic from 'cosmicjs'
import nodemailer from 'nodemailer'
import async from 'async'
import _ from 'lodash'
module.exports = (app, config, partials) => {
  app.post('/send-email', (req, res) => {
    const data = req.body
    const text_body = data.message
    if (!config.SMTPS_STRING)
      return res.status(500).send({ "status": "error", "message": "Email not sent.  You need to add the smtps string to your config." })
    const transporter = nodemailer.createTransport(config.SMTPS_STRING);
    async.series([
      callback => {
        Cosmic.getObject({ bucket: { slug: config.COSMIC_BUCKET } }, { slug: 'send-email' }, (err, response) => {
          const object = response.object
          res.locals.from = _.find(object.metafields, { key: 'from_name' }).value + ' <' + _.find(object.metafields, { key: 'from_email' }).value + '>'
          console.log(res.locals.from)
          callback()
        })
      },
      callback => {
        // Send to email
        var mailOptions = {
          from: res.locals.from, // sender address
          to: data.email, // list of receivers
          subject: data.subject, // Subject line
          text: text_body, // plaintext body
          html: text_body // html body
        }
        // Send mail with defined transport object
        transporter.sendMail(mailOptions, function(error, info){
          if(error){
            console.log(error)
            return res.status(500).send({ "status": "mail-error", "message": "Email not sent.  You need to add the smtps string to your config." })
          } else {
            callback()
          }
        })
      },
      callback => {
        var mailOptions2 = {
          from: res.locals.from, // sender address
          to: res.locals.from, // list of receivers
          subject: 'COPY: ' + data.subject, // Subject line
          text: text_body, // plaintext body
          html: text_body // html body
        }
        // Send mail with defined transport object
        transporter.sendMail(mailOptions2, function(error, info){
          if(error){
            console.log(error)
            return res.status(500).send({ "status": "mail-error", "message": "Email not sent.  You need to add the smtps string to your config." })
          } else {
            res.json({ status: 'success' })
          }
        })
      }
    ])
  })
}