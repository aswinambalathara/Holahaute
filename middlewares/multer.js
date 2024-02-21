
const multer = require( 'multer' )
const path = require('path')


const storage = multer.diskStorage({
    destination : ( req, file, cb ) => {
        cb( null, path.join( __dirname, '../public/images/product-images' ))
    },
    filename : ( req, file, cb ) => {
        const uniqueName = Date.now() + '-' + file.originalname
        cb( null, uniqueName )
    }
})

const storage2 = multer.diskStorage({
    destination : ( req, file, cb ) => {
        cb( null, path.join( __dirname, '../public/images/categoryImages' ))
    },
    filename : ( req, file, cb ) => {
        const uniqueName = Date.now() + '-' + file.originalname
        cb( null, uniqueName )
    }
})

const storage3 = multer.diskStorage({
    destination : ( req, file, cb ) => {
        cb( null, path.join( __dirname, '../public/images/banners' ))
    },
    filename : ( req, file, cb ) => {
        const uniqueName = Date.now() + '-' + file.originalname
        cb( null, uniqueName )
    }
})

const uploadProd = multer({storage : storage})
const uploadCat = multer({storage : storage2})
const uploadBanner = multer({storage : storage3})

module.exports  = {
    uploadCatogory : uploadCat,
    uploadProduct : uploadProd,
    uploadBanner : uploadBanner
}