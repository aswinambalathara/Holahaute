
module.exports.imageNameArray = (files)=>{
    const imageNameArray = []
for(let file of files){
imageNameArray.push(file.filename)
}
return imageNameArray
}

module.exports.editImagesArray = (files,existedImagesArray)=>{
 let  imageNameArray = existedImagesArray.length > 0? existedImagesArray : [] 
 if(files !== undefined){
    for(let file of files){
        imageNameArray.push(file.filename)
    }
 }
 return imageNameArray;
}