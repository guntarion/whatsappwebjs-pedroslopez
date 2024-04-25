const express = require('express');
const router = express.Router();
const Customer = require('../models/customer');

router.post('/customer', (req, res) => {
    Customer.createCustomer(req.body, (err, customer) => {
        if (err) res.status(500).send(err);
        else res.status(201).send(customer);
    });
});

router.get('/customer/:id', (req, res) => {
    Customer.getCustomer(req.params.id, (err, customer) => {
        if (err) res.status(500).send(err);
        else res.status(200).send(customer);
    });
});

// Define PUT and DELETE routes similarly using Customer.updateCustomer and Customer.deleteCustomer

module.exports = router;
