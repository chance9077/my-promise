const Promise = require("./promise")

const p = new Promise(resolve => {
  console.log(1)
  resolve(2)
})

p.then(data => {
  console.log(data)
  return 3
}).then(data => {
  console.log(data)
})