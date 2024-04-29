module.exports.generateTargetUrl = async (bannerType, id) => {
  try {
    let link = "";
    if (bannerType === "categoryBanner") {
      link = `/shop?categoryid=${id}`;
    } else {
      link = `/productdetail/${id}`;
    }

    return link;
  } catch (error) {
    console.error();
  }
};
