const express=require('express')
const app=express()
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const multer = require('multer');
var jwt = require('jsonwebtoken');
const emailValidator = require('email-validator');
const Razorpay = require('razorpay')
const crypto = require('crypto');
const socketIo = require('socket.io');
const http = require('http');
const server = http.createServer(app);
var cors = require('cors');

const secretKey = 'uhJjQhJyCGOFKcV27wCXodMB'; 

const AddressCust = require('./model/addressCustSchema');
const Customer = require('./model/customerSchema');
const Mobiles = require('./model/mobilesSchema');
const Laptops = require('./model/laptopsSchema');
const Headsets = require('./model/headsetsSchema');
const Men = require('./model/menSchema');
const Women = require('./model/womenSchema');
const Cart = require('./model/cartSchema');
const Orders = require('./model/ordersSchema');
const Payment = require('./model/paymentSchema');
const Review = require('./model/reviewSchema');
const Wishlist = require('./model/wishlistSchema');
const Message = require('./model/messageSchema');

app.use(cors())

mongoose.connect('mongodb://127.0.0.1:27017/Pikwares')
  .then(() => console.log('Connected!'));

  const db=mongoose.connection

  app.use(express.json())

  const io = socketIo(server,{
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET','POST'],
        credentials: true,
        transports: ['websocket'],
        pingInterval: 10000,
        pingTimeout: 5000,
    },
  });
  const PORT = 8000;


  const storage = multer.memoryStorage(); // Store files in memory
  const upload = multer({ storage: storage, limits: { fieldSize: 25 * 1024 * 1024 }, });


  const verifyToken=(req,res,next)=>{
    const token= req.headers['authorization'];
    // console.log(token,'token');

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


  const razorpay = new Razorpay({
    key_id: 'rzp_test_tgyzb525OhQfY8',
    key_secret: 'uhJjQhJyCGOFKcV27wCXodMB'
  })

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
            console.log('admin');
            return res.status(200).json({ admin: true, token, id: 'a1b2c3' });
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
        console.log('Cust id: ',id);
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
      // console.log('findadrsid: ',id);
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
    // console.log('reqbody: ',req.body);
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
          productactualprice: body.productactualprice,
          deliverycharge: body.deliverycharge,
          stock: body.stock,
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
            productactualprice: body.productactualprice,
            deliverycharge: body.deliverycharge,
            stock: body.stock,
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
            productactualprice: body.productactualprice,
            deliverycharge: body.deliverycharge,
            stock: body.stock,
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
          productactualprice: body.productactualprice,
          deliverycharge: body.deliverycharge,
          stock: body.stock,
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
          productactualprice: body.productactualprice,
          deliverycharge: body.deliverycharge,
          stock: body.stock,
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
        // console.log('mobileProducts response: ',response);
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
        // console.log('laptopProducts response: ',response);
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
        // console.log('headsetProducts response: ',response);
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
        // console.log('menProducts response: ',response);
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
        // console.log('womenProducts response: ',response);
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

  app.delete('/deleteLaptops/:id', async (req,res)=>{
    let id =req.params.id
    let response = await Laptops.findByIdAndDelete(id)
    res.json(response)
    console.log(response);
  })

  app.delete('/deleteHeadsets/:id', async (req,res)=>{
    let id =req.params.id
    let response = await Headsets.findByIdAndDelete(id)
    res.json(response)
    console.log(response);
  })

  app.delete('/deleteMen/:id', async (req,res)=>{
    let id =req.params.id
    let response = await Men.findByIdAndDelete(id)
    res.json(response)
    console.log(response);
  })

  app.delete('/deleteWomen/:id', async (req,res)=>{
    let id =req.params.id
    let response = await Women.findByIdAndDelete(id)
    res.json(response)
    console.log(response);
  })

  app.delete('/deleteProduct/:id/:category', async (req,res)=>{
    try{

      let id =req.params.id
      let category =req.params.category
      
      if(category==='mobilephones'){
        let response = await Mobiles.findByIdAndDelete(id)
        console.log(response);
        res.json(response)
      }

      if(category==='laptops'){
        let response = await Laptops.findByIdAndDelete(id)
        console.log(response);
        res.json(response)
      }

      if(category==='headsets'){
        let response = await Headsets.findByIdAndDelete(id)
        console.log(response);
        res.json(response)
      }

      if(category==='men'){
        let response = await Men.findByIdAndDelete(id)
        console.log(response);
        res.json(response)
      }

      if(category==='women'){
        let response = await Women.findByIdAndDelete(id)
        console.log(response);
        res.json(response)
      }

    }catch(err){
      console.log(err);
      res.status(500).json(err.message)
    }
  })

  app.get('/findCustomers', verifyToken, async (req,res)=>{

    console.log('req body: ',req.body);
    
    try{

      let response = await Customer.find()
      console.log(response,'customers response');
      res.json(response)
    }catch(err){
      console.log(err.message);
      res.status(500).json(err.message)
    }
  }) 

  app.get('/findOneProduct/:id/:category', async (req,res)=>{

    let id = req.params.id
    let category = req.params.category
    console.log(id,'id product');
    console.log(category,'category');

    try{

      if(category === 'mobilephones'){
        let response = await Mobiles.findById(id)
        // if(!response){
        //   return res.json({message:'Out of Stock'})
        // }
        // console.log(response,'mobile product response');
        res.json(response)
      }

      if(category === 'laptops'){
        let response = await Laptops.findById(id)
        // console.log(response,'product response');
        res.json(response)
      }

      if(category === 'headsets'){
        let response = await Headsets.findById(id)
        console.log(response,'product response');
        res.json(response)
      }

      if(category === 'men'){
        let response = await Men.findById(id)
        // console.log(response,'product response');
        res.json(response)
      }

      if(category === 'women'){
        let response = await Women.findById(id)
        // console.log(response,'product response');
        res.json(response)
      }
      
    }catch(err){
      console.log(err);
      res.status(500).json(err.message)
    }
  })

  app.post('/insertCart/:id', async (req,res)=>{

    let data = ({ customerId: req.params.id,productId: req.body._id , productname: req.body.productname, productprice: req.body.productprice, productcategory: req.body.productcategory, productdescription: req.body.productdescription, productactualprice: req.body.productactualprice, images: req.body.images})
    console.log(data,'cart item');

    try{

      let newCart = new Cart(data)
      let response = await newCart.save()
      console.log(response,'cart response');
      res.json(response)

    }catch(err){
      console.log(err.message);
      res.status(500).json(err.message)
    }
  })

  app.get('/findCart/:id', async (req,res)=>{

    let id = req.params.id
    
    try{
      let response = await Cart.find({customerId:id})
      // console.log(response,'cart find response');
      res.json(response)
    }catch(err){
      console.log(err.message);
      res.status(500).json(err.message)
    }

  })

  app.get('/findOneCart/:id/:customerId', verifyToken, async (req,res)=>{

    let id = req.params.id
    let customerId = req.params.customerId
    console.log(id,'prid');
    
    try{
      let response = await Cart.findOne({productId:id,customerId:customerId})
      console.log(response,'cart find response');
      res.json(response)
    }catch(err){
      console.log(err.message);
      res.status(500).json(err.message)
    }

  })

  app.delete('/deleteCartProduct/:id', async (req,res)=>{

    let id = req.params.id

    try{
      let response = await Cart.findByIdAndDelete(id)
      console.log(response,'deleted cart product');
      res.json(response)
    }catch(err){
      console.log(err.message);
      res.status(500).json(err.message)
    }
  })

  app.post('/orders/insert', async(req,res)=>{
    try{
      console.log(req.body,'order reqbody');

      // const existingOrder = await Orders.findOne({ productId: req.body.productId, customerId:req.body.customerId });

      // if (existingOrder) {
      //   let cancelledOrder = await Orders.findOne({ productId: req.body.productId, customerId: req.body.customerId });
      
      //   if (cancelledOrder) {
      //     const { orderStatus, _id, customerId, productId, statusDate } = cancelledOrder;
      
      //     console.log(orderStatus, 'status');
      
      //     if (orderStatus !== 'Order Cancelled') {
      //       return res.status(400).json({ message: 'This product has already been ordered.' });
      //     }
      //   }
      
      // }

      let newOrder = new Orders(req.body)
      let response = await newOrder.save()
      console.log(response,'order insert response');
      let MobileStock = await Mobiles.findById(req.body.productId)
      if(MobileStock.data!==''){
        const newStock = MobileStock.stock - req.body.count
        let MobileStockChange = await Mobiles.findByIdAndUpdate(req.body.productId, {stock:newStock}, {new:true})
        console.log('mobilestockchange',MobileStockChange);
        // res.json(MobileStockChange)
      }
      res.json(response)
    }catch(err){
      console.log(err);
      res.status(500).json(err.message)
    }
  })

  app.get('/customer/findOrders/:id', verifyToken, async(req,res)=>{
    
    try{
      let id = req.params.id
      let response = await Orders.find({customerId:id})
      // console.log(response,'customer orders response');
      res.json(response)
    }catch(err){
      res.status(500).json(err.message)
      console.log(err);
    }
  })

  app.get('/orderedProducts/:id',verifyToken, async(req,res)=>{

    try{

      let id = req.params.id
      console.log(id,'proid');

      let mobileResponse = await Mobiles.findById(id)
      if(mobileResponse){
        console.log(mobileResponse,'ordered products response');
        return res.json(mobileResponse)
      }

      let laptopResponse = await Laptops.findById(id)
      if(laptopResponse){
        console.log(laptopResponse,'ordered products response');
        return res.json(laptopResponse)
      }

      let headsetResponse = await Headsets.findById(id)
      if(headsetResponse){
        console.log(headsetResponse,'ordered products response');
        return res.json(headsetResponse)
      }

      let menResponse = await Men.findById(id)
      if(menResponse){
        console.log(menResponse,'ordered products response');
        return res.json(menResponse)
      }

      let womenResponse = await Women.findById(id)
      if(womenResponse){
        console.log(womenResponse,'ordered products response');
        return res.json(womenResponse)
      }

    }catch(err){
      console.log(err);
      res.status(500).json(err.message)
    }
  })

  app.put('/updateCount/:id', async (req,res)=>{

    let id = req.params.id
    console.log(id,'id cartupdate');
    console.log(req.body,'reqbody cartupdate');

    try{

      if(req.body.category === 'mobilephones'){
        if(req.body.role==='priceIncrement'){
          let prResponse = await Mobiles.findOne({_id:req.body.productId})
          console.log(prResponse,'prresponse');
          let defaultPrice = prResponse.productprice
          let defaultActualPrice = prResponse.productactualprice
          var newPrice = parseInt(req.body.productprice, 10) + parseInt(defaultPrice, 10);
          var newActualPrice = parseInt(req.body.productactualprice, 10) + parseInt(defaultActualPrice, 10);
        }
        if(req.body.role==='priceDecrement'){
          let prResponse = await Mobiles.findOne({_id:req.body.productId})
          console.log(prResponse,'prresponse');
          let defaultPrice = prResponse.productprice
          let defaultActualPrice = prResponse.productactualprice
          var newPrice = parseInt(req.body.productprice, 10) - parseInt(defaultPrice, 10);
          var newActualPrice = parseInt(req.body.productactualprice, 10) - parseInt(defaultActualPrice, 10);
        }
        let response = await Cart.findByIdAndUpdate(id, { count: req.body.count, productprice: newPrice, productactualprice: newActualPrice }, { new: true });
        console.log(response,'cartupdate response');
        res.json(response)
      }

      if(req.body.category === 'laptops'){
        if(req.body.role==='priceIncrement'){
          let prResponse = await Laptops.findOne({_id:req.body.productId})
          console.log(prResponse,'prresponse');
          let defaultPrice = prResponse.productprice
          let defaultActualPrice = prResponse.productactualprice
          var newPrice = parseInt(req.body.productprice, 10) + parseInt(defaultPrice, 10);
          var newActualPrice = parseInt(req.body.productactualprice, 10) + parseInt(defaultActualPrice, 10);
        }
        if(req.body.role==='priceDecrement'){
          let prResponse = await Laptops.findOne({_id:req.body.productId})
          console.log(prResponse,'prresponse');
          let defaultPrice = prResponse.productprice
          let defaultActualPrice = prResponse.productactualprice
          var newPrice = parseInt(req.body.productprice, 10) - parseInt(defaultPrice, 10);
          var newActualPrice = parseInt(req.body.productactualprice, 10) - parseInt(defaultActualPrice, 10);
        }
        let response = await Cart.findByIdAndUpdate(id, { count: req.body.count, productprice: newPrice, productactualprice: newActualPrice }, { new: true });
        // console.log(response,'cartupdate response');
        res.json(response)
      }

      if(req.body.category === 'headsets'){
        if(req.body.role==='priceIncrement'){
          let prResponse = await Headsets.findOne({_id:req.body.productId})
          console.log(prResponse,'prresponse');
          let defaultPrice = prResponse.productprice
          let defaultActualPrice = prResponse.productactualprice
          var newPrice = parseInt(req.body.productprice, 10) + parseInt(defaultPrice, 10);
          var newActualPrice = parseInt(req.body.productactualprice, 10) + parseInt(defaultActualPrice, 10);
        }
        if(req.body.role==='priceDecrement'){
          let prResponse = await Headsets.findOne({_id:req.body.productId})
          console.log(prResponse,'prresponse');
          let defaultPrice = prResponse.productprice
          let defaultActualPrice = prResponse.productactualprice
          var newPrice = parseInt(req.body.productprice, 10) - parseInt(defaultPrice, 10);
          var newActualPrice = parseInt(req.body.productactualprice, 10) - parseInt(defaultActualPrice, 10);
        }
        let response = await Cart.findByIdAndUpdate(id, { count: req.body.count, productprice: newPrice, productactualprice: newActualPrice }, { new: true });
        // console.log(response,'cartupdate response');
        res.json(response)
      }

      if(req.body.category === 'men'){
        if(req.body.role==='priceIncrement'){
          let prResponse = await Men.findOne({_id:req.body.productId})
          console.log(prResponse,'prresponse');
          let defaultPrice = prResponse.productprice
          let defaultActualPrice = prResponse.productactualprice
          var newPrice = parseInt(req.body.productprice, 10) + parseInt(defaultPrice, 10);
          var newActualPrice = parseInt(req.body.productactualprice, 10) + parseInt(defaultActualPrice, 10);
        }
        if(req.body.role==='priceDecrement'){
          let prResponse = await Men.findOne({_id:req.body.productId})
          console.log(prResponse,'prresponse');
          let defaultPrice = prResponse.productprice
          let defaultActualPrice = prResponse.productactualprice
          var newPrice = parseInt(req.body.productprice, 10) - parseInt(defaultPrice, 10);
          var newActualPrice = parseInt(req.body.productactualprice, 10) - parseInt(defaultActualPrice, 10);
        }
        let response = await Cart.findByIdAndUpdate(id, { count: req.body.count, productprice: newPrice, productactualprice: newActualPrice }, { new: true });
        // console.log(response,'cartupdate response');
        res.json(response)
      }

      if(req.body.category === 'women'){
        if(req.body.role==='priceIncrement'){
          let prResponse = await Women.findOne({_id:req.body.productId})
          console.log(prResponse,'prresponse');
          let defaultPrice = prResponse.productprice
          let defaultActualPrice = prResponse.productactualprice
          var newPrice = parseInt(req.body.productprice, 10) + parseInt(defaultPrice, 10);
          var newActualPrice = parseInt(req.body.productactualprice, 10) + parseInt(defaultActualPrice, 10);
        }
        if(req.body.role==='priceDecrement'){
          let prResponse = await Women.findOne({_id:req.body.productId})
          console.log(prResponse,'prresponse');
          let defaultPrice = prResponse.productprice
          let defaultActualPrice = prResponse.productactualprice
          var newPrice = parseInt(req.body.productprice, 10) - parseInt(defaultPrice, 10);
          var newActualPrice = parseInt(req.body.productactualprice, 10) - parseInt(defaultActualPrice, 10);
        }
        let response = await Cart.findByIdAndUpdate(id, { count: req.body.count, productprice: newPrice, productactualprice: newActualPrice }, { new: true });
        // console.log(response,'cartupdate response');
        res.json(response)
      }

    }catch(err){
      console.log(err);
      res.status(500).json(err.message)
    }
  })

  app.get('/admin/findOrders', verifyToken, async(req,res)=>{
    
    try{
      let response = await Orders.find()
      // console.log(response,'customer orders response');
      res.json(response)
    }catch(err){
      res.status(500).json(err.message)
      console.log(err);
    }
  })

  app.get('/admin/orderedCustomers/:id',verifyToken, async(req,res)=>{

    try{

      let id = req.params.id

      let response = await Customer.findById(id)
      
        // console.log(response,'ordered customers response');
        return res.json(response)
      

    }catch(err){
      console.log(err);
      res.status(500).json(err.message)
    }
  })

  app.get('/admin/order/findOne/:id', verifyToken, async(req,res)=>{

    try{
      let id = req.params.id
      let response = await Orders.findById(id)
      // console.log(response,'findOne order response');
      res.json(response)
    }catch(err){
      console.log(err);
      res.status(500).json(err.message)
    }

  })

  app.get('/admin/findOneCustomer/:id', verifyToken, async(req,res)=>{
    try{
      let id = req.params.id
      let response = await Customer.findById(id)
      // console.log(response,'customerAccount response');
      if (!response) {
        return res.status(404).json({ message: 'Customer not found' });
      }
    res.json(response)
}catch(err){
    console.log(err.message);
    res.status(500).json(err.message)
}
})

app.get('/admin/findAddress/:id', verifyToken, async(req,res)=>{
  try{
    let id = req.params.id
    console.log(id,'custId');
    let response = await AddressCust.findOne({customerId:id})
    if (!response) {
      return res.status(404).json({ message: 'Address not found' });
    }
    console.log(response,'address response');
    res.json(response)
  }catch(err){
    console.log(err.message);
    res.status(500).json({message: err.message})
}
})

app.get('/admin/product/findOne/:id', verifyToken, async(req,res)=>{
  try{
      let id = req.params.id

      let mobileResponse = await Mobiles.findById(id)
      if(mobileResponse){
        // console.log(mobileResponse,'ordered products response');
        return res.json(mobileResponse)
      }

      let laptopResponse = await Laptops.findById(id)
      if(laptopResponse){
        // console.log(laptopResponse,'ordered products response');
        return res.json(laptopResponse)
      }

      let headsetResponse = await Headsets.findById(id)
      if(headsetResponse){
        // console.log(headsetResponse,'ordered products response');
        return res.json(headsetResponse)
      }

      let menResponse = await Men.findById(id)
      if(menResponse){
        // console.log(menResponse,'ordered products response');
        return res.json(menResponse)
      }

      let womenResponse = await Women.findById(id)
      if(womenResponse){
        // console.log(womenResponse,'ordered products response');
        return res.json(womenResponse)
      }

  }catch(err){
    console.log(err.message);
    res.status(500).json({message: err.message})
  }
})

app.put('/admin/order/updateStatus/:id', verifyToken, async(req,res)=>{
  try{
    let id = req.params.id
    console.log(req.body,'req');
    const {orderSatus} = req.body
    console.log(orderSatus,'orderstatus');

    const order = await Orders.findById(id);
    order.orderStatus = orderSatus
    order.statusDate = new Date();
    const updatedOrder = await order.save();
    console.log(updatedOrder,'orderUpdate response');
    res.json(updatedOrder)

  }catch(err){
    console.log(err.message);
    res.status(500).json({message: err.message})
  }
})

app.put('/cancelOrder/:id', async(req,res)=>{
  try{
    let id = req.params.id
    console.log(id,'cancel order id');
    let response = await Orders.findByIdAndUpdate(id,req.body)
    console.log(response,'deleted cart response');
    res.json(response)
  }catch(err){
    console.log(err.message);
    res.status(500).json({message: err.message})
  }
})

app.post('/paymentorder', async (req, res) => {
  console.log('payorder');
  console.log(req.body,'req');
  const options = {
      amount: req.body.amount*100,
      currency: 'INR',
      receipt: crypto.randomBytes(10).toString('hex'),
      payment_capture: 1 
  };
  console.log(options,'options');

  try {
      const response = await razorpay.orders.create(options);
      res.json(response);
  } catch (error) {
      console.log(error);
      res.status(400).send('not able to establish order');
  }
});

const hmac_sha256 = (data, key) => {
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(data);
  return hmac.digest('hex');
};

app.post('/paymentCapture',async (req, res) => {

    console.log(req.body,'reqbody');

      generated_signature = hmac_sha256(req.body.razorId + "|" + req.body.paymentId, secretKey);

      if (generated_signature == req.body.signature) {
        console.log('payment is successful')
      
      try {
        const paymentData = { razorId: req.body.razorId, currency: 'INR', amount: req.body.amount/100, paymentId: req.body.paymentId };

          const newPayment = new Payment(paymentData)
          const savedPayment = await newPayment.save();
          console.log('Payment saved to database:', savedPayment);
          res.json({ status: 'ok',savedPayment });
          // res.redirect(`http://localhost:3000/paymentSuccess?reference=${savedPayment.paymentId}`)
          // return
      } catch (error) {
          console.error('Error saving payment to database:', error);
          res.status(500).send('Internal Server Error');
      }
  } else {
      res.status(400).send('Invalid signature');
  }
});  

app.get('/findOrder/:id', verifyToken, async(req,res)=>{
  try{
    const id = req.params.id
    let response = await Orders.findOne({paymentId:id})
    console.log(response,'findorder reponse');
    res.json(response)
  }catch(err){
    console.log(err);
    res.status(500).json(err.message)
  }
})

app.get('/findPayment/:id', verifyToken, async(req,res)=>{
  try{
    const id = req.params.id
    let response = await Payment.findOne({paymentId:id})
    console.log(response,'findPayment reponse');
    res.json(response)
  }catch(err){
    console.log(err);
    res.status(500).json(err.message)
  }
})

app.post('/review/insert', async(req,res)=>{
  try{
    // console.log(req.body,'reqbody');
    const {productId,customerId,review,rating} = req.body
    let alreadyReviewed = await Review.findOne({customerId:customerId,productId:productId})
    console.log(alreadyReviewed,'already reviewed');
    if (alreadyReviewed) {
      return res.status(500).json('Already reviewed')
    }
    let newReview = new Review(req.body)
    let response = await newReview.save()
    console.log(response,'review response');
    res.json(response)
  }catch(err){
    console.log(err);
    res.status(500).json(err.message)
  }
})

app.get('/findReview/:id', async(req,res)=>{
  try{
    const id = req.params.id
    let response = await Review.find({productId:id})
    console.log(response,'find review response');
    res.json(response)
  }catch(err){
    console.log(err);
    res.status(500).json(err.message)
  }
})

app.get('/review/customers/:id', async(req,res)=>{
  try{
    const id = req.params.id
    let response = await Customer.findOne({_id:id})
    console.log(response,'reviewed customers response');
    res.json(response)
  }catch(err){
    console.log(err);
    res.status(500).json(err.message)
  }
})

app.post('/insertWishlist/:id', async (req,res)=>{

  let data = ({ customerId: req.params.id,productId: req.body._id , productname: req.body.productname, productprice: req.body.productprice, productcategory: req.body.productcategory, productdescription: req.body.productdescription, images: req.body.images})
  console.log(data,'wishlist item');

  try{

    let newWishlist = new Wishlist(data)
    let response = await newWishlist.save()
    console.log(response,'wishlist added response');
    res.json(response)

  }catch(err){
    console.log(err.message);
    res.status(500).json(err.message)
  }
})

app.delete('/deleteWishlist/:id', async (req,res)=>{
  try{
    let id = req.params.id
    let response = await Wishlist.findByIdAndDelete(id)
    console.log(response,'wishlist deleted response');
    res.json(response)
  }catch(err){
    console.log(err);
    res.status(500).json(err.message)
  }
})

app.delete('/viewProduct/deleteWishlist/:id', async (req,res)=>{
  try{
    let id = req.params.id
    let response = await Wishlist.deleteOne({productId:id})
    console.log(response,'wishlist deleted response');
    res.json(response)
  }catch(err){
    console.log(err);
    res.status(500).json(err.message)
  }
})

app.get('/findWishlist/:id', async (req,res)=>{

  let id = req.params.id
  
  try{
    let response = await Wishlist.find({customerId:id})
    // console.log(response,'wishlist find response');
    res.json(response)
  }catch(err){
    console.log(err.message);
    res.status(500).json(err.message)
  }

})


io.on('connection', (socket) => {

  socket.on('joinRoom', async (data) => {
    const { room, to, hint } = data;
    console.log(hint);

    try {
      const messages = await Message.find({ $or: [{ room:room }, { room:to }] }).sort({ timestamp: 1 });

      socket.emit('loadMessages', { messages });
      
    } catch (error) {
      console.error('Error fetching messages:', error);
    }

    socket.join(room);
  });

  // socket.on('adminMessage', async (data) => {
  //   const { room, customerId, message, role } = data;
  //   console.log(data,'admin msgdata');

  //   try {
  //     const newMessage = new Message({ room, customerId, message, role });
  //     const response = await newMessage.save();
  //     console.log(response, 'adminMessage insert');

  //     io.to(room).emit('adminMessage', data)

  //     // Broadcast the message to all users in the room
  //     // io.to(room).emit('userMessage', { user, message });
  //   } catch (error) {
  //     console.error('Error saving message:', error);
  //   }
  // });

  socket.on('sendMessage', async (data) => {
    const { room, to, customerId, message, role } = data;

    try {
      const newMessage = new Message({ room, customerId, message, role });
      const response = await newMessage.save()
      ;
      console.log(response, 'sendMessage insert');
      io.to(to).emit('recieveMessage', response)

    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});



server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

  // app.listen(8000)

  // module.exports = app