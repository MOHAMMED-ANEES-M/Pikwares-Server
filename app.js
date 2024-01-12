const express=require('express')
const app=express()
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const multer = require('multer');
const Customer = require('./model/customerSchema');
const AddressCust = require('./model/addressCustSchema');
var jwt = require('jsonwebtoken');
const emailValidator = require('email-validator');


var cors = require('cors');
const Mobiles = require('./model/mobilesSchema');
const Laptops = require('./model/laptopsSchema');
const Headsets = require('./model/headsetsSchema');
const Men = require('./model/menSchema');
const Women = require('./model/womenSchema');

app.use(cors())

mongoose.connect('mongodb://127.0.0.1:27017/Pikwares')
  .then(() => console.log('Connected!'));

  const db=mongoose.connection

  app.use(express.json())

  const storage = multer.memoryStorage(); // Store files in memory
  const upload = multer({ storage: storage, limits: { fieldSize: 25 * 1024 * 1024 }, });


  const verifyToken=(req,res,next)=>{
    const token= req.headers['authorization'];
    console.log(token,'token');

    if(!token){
        return res.status(403).json({ message: 'Token is not provided'})
    }

    jwt.verify(token,'abc',(err,decoded)=>{
        if(err){
            return res.status(401).json({message: 'Unauthorized: Invalid token'})
        }
        req.decoded= decoded
        console.log(req.decoded);
        next();
    });
  };


  const verifyAdmin = async (req, res, next) => {

    if (req.body.email === "admin@gmail.com" && req.body.password === "11111") {
      const token = jwt.sign({ id: express.response.id, email: express.response.email }, 'abc');
      res.locals.adminToken = token
      console.log('token: ',token);
    }
    next();

  };


  app.post('/customer/insert', async (req,res)=>{

    console.log(req.body);

    try{

        const { username, email, password, firstname, lastname, number } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        const newCustomer = new Customer({ username, email, password, firstname, lastname, number });

        // Email validation using Mongoose schema validation
         const validationError = newCustomer.validateSync();
         if (validationError && validationError.errors && validationError.errors.email) {
             return res.status(400).json({ message: validationError.errors.email.message });
         }

        const hashedPassword = await bcrypt.hash(req.body.password,saltRounds);
        newCustomer.password = hashedPassword;
        let response = await newCustomer.save()
        console.log(response);
        res.json(response)
    }catch(err){
        console.log('Error:', err.message);
        res.status(500).json({ message: err.message })
    }

  })

  app.post('/login', verifyAdmin, async (req,res)=>{

    const  { email, password } = req.body
    console.log(req.body);

    try{
        if (email && password) {

          token = res.locals.adminToken

          let response = await Customer.findOne({email})
          
          if (token) {
            return res.status(200).json({ admin: true, token, id: response.id });
          }
          
            console.log(response);
            if (response) {
                const passwordMatch = await bcrypt.compare(password,response.password);

                if (!passwordMatch) {
                return res.status(401).json({ message: 'Invalid email or password' });
                }        
                
                const token = jwt.sign({ id: response.id, email: response.email },'abc');
                res.json({status:true, token, id: response.id, firstname: response.firstname})
                console.log('token',token);
            }
            else{
                res.json({status:false})
            }
        }
    }catch(err){
        console.error(err);
        res.status(500).json({ status: false, message: err.message });
    }

  })

  app.get('/customer/findAccount', verifyToken, async (req,res)=>{

    try{
        let {id} = req.query
        // console.log('id: ',id);
        let response = await Customer.findOne({_id:id})
        if (!response) {
            return res.status(404).json({ message: 'Customer not found' });
          }
        res.json(response)
        // console.log('account response: ',response);
    }catch(err){
        console.log(err.message);
        res.status(500).json({message: err.message})
    }
  })


  app.put('/customer/update', async (req,res)=>{
    const  { email, firstname, lastname, number } = req.body
    try{

      const lengthFields = { firstname, lastname }

      for(const field in lengthFields){

        if ( lengthFields[field].toString().length < 3  || lengthFields[field].toString().length > 15) {
          const errorMessage = `${field} must be with a length of at least 3 digits and maximum 12 digits.`;
          return res.status(400).json({ message: errorMessage });
      }

  }

      if ( number.toString().length !== 10 ) {
        const errorMessage = 'Number must be a valid number with a length of 10 digits.';
        return res.status(400).json({ message: errorMessage });
    }

      const isValidEmail = emailValidator.validate(email);

      if (!isValidEmail) {
        res.status(400).json({ message: 'Invalid email address' });
        return;
      }

      let {id} = req.query
      console.log('update customer id: ',id);
      console.log('reqbody: ',req.body);
      const response = await Customer.findByIdAndUpdate(id, req.body);
        
      if (!response) {
          return res.status(404).json({ message: 'Customer not found' });
        }   

        res.json(response)
        console.log('customerUpdateResponse: ',response);
    }catch(err){
      console.log(err.message);
      res.status(500).json({ message: err.message });
    }
  })

  app.post('/customer/address/insert', async (req,res)=>{
    try{

      let {id} = req.query
      console.log('body: ',req.body);
      console.log('id: ',id);
      const data = { customerId: id, ...req.body };
      console.log('data: ',data);
      let newAddress = new AddressCust(data)
      let response = await newAddress.save()
      console.log(response);
      res.json(response)
    }catch(err){
      console.log(err.message);
      res.status(500).json({message: err.message})
    }
  })


  app.get('/customer/address/findAddress',verifyToken, async(req,res)=>{
    try{
      let {id} = req.query
      console.log('findadrsid: ',id);
      let response = await AddressCust.findOne({customerId:id})
        if (!response) {
          console.log('Adddress not found');
            return res.status(404).json({ message: 'Adddress not found' });
          }
        res.json(response)
        // console.log('address response: ',response);
    }catch(err){
        console.log(err.message);
        res.status(500).json({message: err.message})
    }
  })

  app.put('/customer/address/update', async (req,res)=>{

    const  { city, district, state, landmark } = req.body
    console.log('adrsupdtreqbody: ',req.body);

    try{

      const lengthFields = { city, district, state }

      for(const field in lengthFields){

        if ( lengthFields[field].toString().length < 3  || lengthFields[field].toString().length > 15) {
          const errorMessage = `${field} must be with a length of at least 3 digits and maximum 12 digits.`;
          return res.status(400).json({ message: errorMessage });
      }

  }      

  if(landmark.toString().length < 10){
    const errorMessage = `landmark must be with a length of at least 10 digits.`;
          return res.status(400).json({ message: errorMessage });
  }

      let {id} = req.query
      console.log('update id: ' ,id);
      const response = await AddressCust.findByIdAndUpdate(id, req.body);
        
      if (!response) {
          return res.status(404).json({ message: 'Address not found' });
        }    
        
        console.log(response,'upateadrs done');
        res.json(response)
    }catch(err){
      console.log(err.message);
      res.status(500).json({ message: err.message });
    }
  })

  app.post('/products/insert', upload.array('images', 5), async (req,res)=>{

    const { body } = req;
    console.log('reqbody: ',req.body.images);
    // const images = req.body.images.map(file => ({
    //   filename: file.originalname,
    //   data: file.buffer,
    // }));
    const productCategory = body.productcategory

    try{
      console.log('category',productCategory);

      if(req.body.images){


      if (productCategory === 'mobilephones') {
        console.log('mobile working');
        const newProduct = new Mobiles({
          productname: body.productname,
          productprice: body.productprice,
          productcategory: body.productcategory,
          productdescription: body.productdescription,
          images: req.body.images,
        });
        const response = await newProduct.save();
        res.json(response);
        console.log(response,'response');

        if (!response.images || response.images.length === 0) {
          res.status(500).json({ message: 'Error saving images' });
          return;
        }

      }

        if (productCategory === 'laptops') {
          console.log('laptops working');
          const newProduct = new Laptops({
            productname: body.productname,
            productprice: body.productprice,
            productcategory: body.productcategory,
            productdescription: body.productdescription,
            images: req.body.images,
          });
          const response = await newProduct.save();
          res.json(response);
          console.log(response,'response');

          if (!response.images || response.images.length === 0) {
            res.status(500).json({ message: 'Error saving images' });
            return;
          }

        }

        if (productCategory === 'headsets') {
          console.log('headsets working');
          const newProduct = new Headsets({
            productname: body.productname,
            productprice: body.productprice,
            productcategory: body.productcategory,
            productdescription: body.productdescription,
            images: req.body.images,
          });
          const response = await newProduct.save();
          res.json(response);
          console.log(response,'response');

          if (!response.images || response.images.length === 0) {
            res.status(500).json({ message: 'Error saving images' });
            return;
          }

        }

        if (productCategory === 'men') {
          console.log('men working');
          const newProduct = new Men({
            productname: body.productname,
            productprice: body.productprice,
            productcategory: body.productcategory,
            productdescription: body.productdescription,
            images: req.body.images,
          });
          const response = await newProduct.save();
          res.json(response);
          console.log(response,'response');

          if (!response.images || response.images.length === 0) {
            res.status(500).json({ message: 'Error saving images' });
            return;
          }

        }

        if (productCategory === 'women') {
          console.log('women working');
          const newProduct = new Women({
            productname: body.productname,
            productprice: body.productprice,
            productcategory: body.productcategory,
            productdescription: body.productdescription,
            images: req.body.images,
          });
          const response = await newProduct.save();
          res.json(response);
          console.log(response,'response');

          if (!response.images || response.images.length === 0) {
            res.status(500).json({ message: 'Error saving images' });
            return;
          }

        }
  
      }else{
        console.log('images is required');
      }

    }catch(err){
      console.log(err.message);
      res.status(500).json({message: err.message})
    }

  })

  app.get('/products/mobiles/find', async (req,res)=>{

    try{
      let response = await Mobiles.find()
        if (!response) {
          console.log('Products not found');
            return res.status(404).json({ message: 'Products not found' });
          }
        res.json(response)
        console.log('mobileProducts response: ',response);
    }catch(err){
        console.log(err.message);
        res.status(500).json({message: err.message})
    }
  })

  app.get('/products/laptops/find', async (req,res)=>{

    try{
      let response = await Laptops.find()
        if (!response) {
          console.log('Products not found');
            return res.status(404).json({ message: 'Products not found' });
          }
        res.json(response)
        console.log('laptopProducts response: ',response);
    }catch(err){
        console.log(err.message);
        res.status(500).json({message: err.message})
    }
  })

  app.get('/products/headsets/find', async (req,res)=>{

    try{
      let response = await Headsets.find()
        if (!response) {
          console.log('Products not found');
            return res.status(404).json({ message: 'Products not found' });
          }
        res.json(response)
        console.log('headsetProducts response: ',response);
    }catch(err){
        console.log(err.message);
        res.status(500).json({message: err.message})
    }
  })

  app.get('/products/men/find', async (req,res)=>{

    try{
      let response = await Men.find()
        if (!response) {
          console.log('Products not found');
            return res.status(404).json({ message: 'Products not found' });
          }
        res.json(response)
        console.log('menProducts response: ',response);
    }catch(err){
        console.log(err.message);
        res.status(500).json({message: err.message})
    }
  })

  app.get('/products/women/find', async (req,res)=>{

    try{
      let response = await Women.find()
        if (!response) {
          console.log('Products not found');
            return res.status(404).json({ message: 'Products not found' });
          }
        res.json(response)
        console.log('womenProducts response: ',response);
    }catch(err){
        console.log(err.message);
        res.status(500).json({message: err.message})
    }
  })


  app.delete('/deleteMobiles/:id', async (req,res)=>{
    let id =req.params.id
    let response = await Mobiles.findByIdAndDelete(id)
    res.json(response)
    console.log(response);
  })

  app.listen(8000)
