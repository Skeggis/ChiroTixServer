require('dotenv').config()
function createReceiptEmail(link, orderNr, eventName, ownerName, amountOfTickets, price){
  let chiroTixEmail = process.env.CHIROTIX_EMAIL
  let chiroTixUrl = process.env.CHIROTIX_URL
  return `
  <!doctype html>
  <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  
  <head>
    <title> </title>
    <!--[if !mso]><!-- -->
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <!--<![endif]-->
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style type="text/css">
      #outlook a {
        padding: 0;
      }
  
      body {
        margin: 0;
        padding: 0;
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
  
      table,
      td {
        border-collapse: collapse;
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }
  
      img {
        border: 0;
        height: auto;
        line-height: 100%;
        outline: none;
        text-decoration: none;
        -ms-interpolation-mode: bicubic;
      }
  
      p {
        display: block;
        margin: 13px 0;
      }
    </style>
    <!--[if mso]>
          <xml>
          <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
          </xml>
          <![endif]-->
    <!--[if lte mso 11]>
          <style type="text/css">
            .mj-outlook-group-fix { width:100% !important; }
          </style>
          <![endif]-->
    <!--[if !mso]><!-->
    <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700" rel="stylesheet" type="text/css">
    <link href="https://fonts.googleapis.com/css?family=Ubuntu:300,400,500,700" rel="stylesheet" type="text/css">
    <style type="text/css">
      @import url(https://fonts.googleapis.com/css?family=Roboto:300,400,500,700);
      @import url(https://fonts.googleapis.com/css?family=Ubuntu:300,400,500,700);
    </style>
    <!--<![endif]-->
    <style type="text/css">
      @media only screen and (min-width:480px) {
        .mj-column-per-100 {
          width: 100% !important;
          max-width: 100%;
        }
      }
    </style>
    <style type="text/css">
    </style>
    <style type="text/css">
      .button td:hover {
        background-color: black;
        color: black;
      }
    </style>
  </head>
  
  <body>
    <div style="">
      <!--[if mso | IE]>
        <table
           align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
        >
          <tr>
            <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
        <![endif]-->
      <div style="background:#4287f5;background-color:#4287f5;margin:0px auto;max-width:600px;">
          <h1 style="font-family:Ubuntu, Helvetica, Arial, sans-serif;padding:10px 0 0 5px;font-size:20px;font-weight:200;line-height:1;color:white;"">Order #${orderNr}</h1>
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#4287f5;background-color:#4287f5;width:100%;">
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:0 0 20px 0;text-align:center;">
                <!--[if mso | IE]>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  
          <tr>
        
              <td
                 class="" style="vertical-align:top;width:600px;"
              >
            <![endif]-->
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                    <tr>
                      <td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                        <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:42px;font-weight:300;line-height:1;text-align:center;color:white;">ChiroTix</div>
                      </td>
                    </tr>
                  </table>
                </div>
                <!--[if mso | IE]>
              </td>
            
          </tr>
        
                    </table>
                  <![endif]-->
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!--[if mso | IE]>
            </td>
          </tr>
        </table>
        
        <table
           align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
        >
          <tr>
            <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
        <![endif]-->
      <div style="background:white;background-color:white;margin:0px auto;max-width:600px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:white;background-color:white;width:100%;">
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;">
                <!--[if mso | IE]>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  
          <tr>
        
              <td
                 class="" style="vertical-align:top;width:600px;"
              >
            <![endif]-->
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                    <tr>
                      <td align="center" style="font-size:0px;padding:10px 25px 0 25px;padding-top:50px;word-break:break-word;">
                        <div style="font-family:Roboto;font-size:32px;font-weight:300;line-height:1;text-align:center;color:#000000;">Thanks for the order</div>
                      </td>
                    </tr>
                    <tr>
                        <td align="center" style="font-size:0px;padding:0 25px 0 25px;padding-top:40px;word-break:break-word;">
                            <div style="font-family:Roboto;font-size:16px;font-weight:200;line-height:1;text-align:left;color:#000000;">Please save this email and the order number above!</div>
                          </td>
                    </tr>
                    <tr>
                        <td align="center" style="font-size:0px;padding:0 25px 10px 25px;padding-top:15px;word-break:break-word;">
                            <div style="display:flex;flex-direction:column;align-items:flex-start;">
                                <div style="display:flex;flex-direction:row;width: 100%;margin:0;height:30px;">
                                    <h3 style="font-family:Roboto;font-size:16px;font-weight:500;text-align:left;color:#000000;margin-bottom:0">Event:</h3>
                                    <h3 style="font-family:Roboto;font-size:16px;font-weight:300;text-align:left;color:#000000;margin-left:5px;">${eventName}</h3>
                                </div>
                                <div style="display:flex;flex-direction:row;width: 100%;margin:0;height:30px;">
                                    <h3 style="font-family:Roboto;font-size:16px;font-weight:500;text-align:left;color:#000000;margin-bottom:0">Owner:</h3>
                                    <h3 style="font-family:Roboto;font-size:16px;font-weight:300;text-align:left;color:#000000;margin-left:5px;">${ownerName}</h3>
                                </div>
                                <div style="display:flex;flex-direction:row;width: 100%;margin:0;height:30px;">
                                    <h3 style="font-family:Roboto;font-size:16px;font-weight:500;text-align:left;color:#000000;margin-bottom:0">Amount of tickets:</h3>
                                    <h3 style="font-family:Roboto;font-size:16px;font-weight:300;text-align:left;color:#000000;margin-left:5px;">${amountOfTickets}</h3>
                                </div>
                                <div style="display:flex;flex-direction:row;width: 100%;margin:0;height:30px;">
                                    <h3 style="font-family:Roboto;font-size:16px;font-weight:500;text-align:left;color:#000000;margin-bottom:0">Amount:</h3>
                                    <h3 style="font-family:Roboto;font-size:16px;font-weight:300;text-align:left;color:#000000;margin-left:5px;">${price} $</h3>
                                </div>
                                </div>
                            </div>
                        </td>
                        
                    </tr>

                  </table>
                </div>

                <!--[if mso | IE]>
              </td>
            
          </tr>
        
                    </table>
                  <![endif]-->
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!--[if mso | IE]>
            </td>
          </tr>
        </table>
        
        <table
           align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
        >
          <tr>
            <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
        <![endif]-->
      <div style="background:white;background-color:white;margin:0px auto;max-width:600px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:white;background-color:white;width:100%;">
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:0px 0 20px 0;padding-bottom:25px;text-align:center;">
                <!--[if mso | IE]>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  
          <tr>
        
              <td
                 class="" style="vertical-align:top;width:600px;"
              >
            <![endif]-->
                <div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                  <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%">
                    <tr>
                      <td align="center" vertical-align="middle" class="button" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;line-height:100%;">
                          <tr>
                            <td align="center" bgcolor="white" role="presentation" style="border:2px solid #4287f5;border-radius:5px;cursor:auto;height:30px;mso-padding-alt:10px 25px;background:white;" valign="middle"> <a href="${link}" style="display:inline-block;background:white;color:black;font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:18px;font-weight:normal;line-height:32px;margin:0;text-decoration:none;text-transform:none;padding:10px 25px;mso-padding-alt:0px;border-radius:5px;"
                                target="_blank">
                Receipt
              </a> </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </div>
                <!--[if mso | IE]>
              </td>
            
          </tr>
        
                    </table>
                  <![endif]-->
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!--[if mso | IE]>
            </td>
          </tr>
        </table>
        
        <table
           align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
        >
          <tr>
            <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
        <![endif]-->
      <div style="background:lightgrey;background-color:lightgrey;margin:0px auto;max-width:600px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:lightgrey;background-color:lightgrey;width:100%;">
          <tbody>
              <tr>      
                  <div style="padding-top:20px;background:lightgrey;background-color:lightgrey;margin:0px auto;max-width:500px; color:black">
                You have received this email because of a purchase of tickets through the website <a style="color:blue" href="${chiroTixUrl}">${chiroTixUrl}</a>, if you do not recognise this purchase as your own please forward this email to <a style="color:blue" href="${chiroTixEmail}">${chiroTixEmail}</a>.
                </div>
            </tr>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:20px 0;padding-top:20px;text-align:center;">
                <!--[if mso | IE]>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  
          <tr>
        
              <td
                 align="center" class="" style=""
              >
            <![endif]-->
                <div style="font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:13px;line-height:1;text-align:center;color:#000000;">© ChiroTix</div>
                <!--[if mso | IE]>
              </td>
            
          </tr>
        
                    </table>
                  <![endif]-->
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!--[if mso | IE]>
            </td>
          </tr>
        </table>
        <![endif]-->
    </div>
  </body>
  
  </html>
  `
}

module.exports = {createReceiptEmail}