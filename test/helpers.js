const originalLogFunction = console.log;
const originalErrorFunction = console.error;
let output;
let errorOutput;
async function silence() {

  beforeEach(async function () {
    output = '';
    errorOutput = ''
    console.log = (msg) => {
      output += msg + '\n';
    };

    console.error = (msg) => {
      errorOutput += msg + '\n'
    }
  });

  afterEach(async function () {
    console.log = originalLogFunction; // undo dummy log function
    console.error = originalErrorFunction
    if (this.currentTest.state === 'failed') {
      console.log(output);
      console.error(errorOutput)
    }
  });

}

async function verbose() {
  console.log = originalLogFunction; // undo dummy log function
  console.log(output);
}


async function silenceBefore(){
  output = '';
    errorOutput = ''
    console.log = (msg) => {
      output += msg + '\n';
    };

    console.error = (msg) => {
      errorOutput += msg + '\n'
    }
}

async function ordersTableDataFormat(){
  
}

module.exports = { silence, verbose, silenceBefore }
