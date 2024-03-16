const qtyUpBtn = document.querySelectorAll('.upBtn');
const qtyDownBtn = document.querySelectorAll('.downBtn');
let qtyInput = document.querySelectorAll('.qtyInput');
const removeBtn = document.querySelectorAll('.removeBtn');
const serverError = `<%=error%>`
const modal = document.getElementById('orderErrorModal')
addEventListener('DOMContentLoaded',()=>{
    if (serverError.length > 0) {
 const error = serverError.split('*')
    const errorDiv = document.querySelector('.error-modal')
    errorDiv.querySelector('.errorProducts').innerText = error[0]
    errorDiv.querySelector('.errorMessage').innerText = error[1]
   // console.log(modal)
    modal.click()
    document.getElementById('okBtn').onclick = () =>{
        location.reload();
    }
}
})
    


function setError(btn, message) {
    const errorParent = btn.closest('#ancestor');
    const errorDiv = errorParent.querySelector('.error')
    errorDiv.innerText = message
}

qtyUpBtn.forEach((btn) => {
    btn.addEventListener('click', async () => {
        const itemId = btn.getAttribute('data-itemId');
        //console.log(itemId)
        const btnParent = btn.parentElement;
        let qtyInput = btnParent.querySelector('.qtyInput')
        let quantity = qtyInput.value;
        if (quantity < 5) {
            quantity++
            const data = await updateCartQuantity(itemId, quantity,)
            if (data.status === true) {
                //qtyInput.value = quantity
                location.reload()
            } else {
                setError(btn, data.message)
            }
        } else {
            setError(btn, "Maximum buying quantity reached")
        }
    })
})

qtyDownBtn.forEach((btn) => {
    btn.addEventListener("click", async () => {
        const itemId = btn.getAttribute('data-itemId');
        const btnParent = btn.parentElement;
        let qtyInput = btnParent.querySelector('.qtyInput');
        let quantity = qtyInput.value;
        if (quantity > 1) {
            setError(btn, '')
            quantity--
            const data = await updateCartQuantity(itemId, quantity);
            if (data.status === true) {
                //qtyInput.value = quantity;
                location.reload()
            }
        }
    })
})

async function updateCartQuantity(itemId, quantity) {
    //console.log(itemId," ",quantity)
    const response = await fetch('/cart/updatequantity', {
        method: 'PATCH',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            itemId: itemId,
            quantity: Number(quantity)
        })
    })

    const data = await response.json()
    return data
}

removeBtn.forEach((btn) => {
    btn.addEventListener('click', () => {
        const itemId = btn.getAttribute('data-itemId')
        removeAlert(itemId)
    })
})

function removeAlert(itemId) {
    Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!"
    }).then(async (result) => {
        if (result.isConfirmed) {
            const response = await fetch(`/cart/removeitem/${itemId}`, {
                method: 'PATCH',
                headers: {
                    "Content-Type": "application/json"
                }
            })
            const data = await response.json()
            if (data.status === true) {
                location.reload()
            }
        }
    });
}

