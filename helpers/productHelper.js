
const fs = require('fs').promises

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

module.exports.existImageFiles = async (imageNameArray) => {
    try {
        const directory = 'public/images/product-images'; // Path to your image directory
        const images = [];
        for(const imageName of imageNameArray){
            const imagePath = `${directory}/${imageName}`;
            const imageData = await fs.readFile(imagePath);
            const base64Image = imageData.toString('base64');
            images.push({ filename: imageName, data: base64Image });
        }
        console.log(images);
        return images
    } catch (error) {
        console.error(error);
        throw error; // Rethrow the error to propagate it outside the function
    }
};
