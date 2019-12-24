function test(){
  // let t = setInterval(() => {
  //   bro()
  //   clearInterval(t)
  // }, 1000)

  let t = setTimeout(() => {
    clearTimeout(t)
    bro()
    
  }, 1000)

  

}

let bro = () => {console.log("BRO")}

test()