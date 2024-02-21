
module.exports.imageNameArray = (files)=>{
    const imageNameArray = []
for(let file of files){
imageNameArray.push(file.filename)
}
return imageNameArray
}