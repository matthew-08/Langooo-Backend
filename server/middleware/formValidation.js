
const Yup = require('yup')

const loginSchema = Yup.object({
    username: Yup.string().required('Username Required')
    .min(6,'username too shrot')
    .max(40, 'username too long'),
    password: Yup.string().required('Password Required')
    .min(6,'password too short')
    .max(40, 'password too long'),
})

module.exports = function validateForm(req, res, next) {
    next()
}