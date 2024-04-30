
module.exports.errorHandler = (err,req,res,next) =>{
    console.error(err.stack);
  // Define specific error handling logic based on error types
  if (err.status === 404) {
    // Handle 404 Not Found errors
    res.status(404).render('error/404', { title: 'Page Not Found' });
  } else if (err.status === 500) {
    // Handle 500 Internal Server Error
    res.status(500).render('error/500', { title: 'Internal Server Error' });
  } else {
    // Default error handling
    res.status(500).render('error/500', { title: 'Error', error: err });
  }
}

module.exports.get404 = (req,res,next) =>{
    res.render('error/404', { title: 'Page Not Found' })
}

module.exports.get500 = (req,res,next)=>{
    res.render('error/500',{ title: 'Internal Server Error' })
}