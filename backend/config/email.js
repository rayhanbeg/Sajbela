import nodemailer from "nodemailer"
import dotenv from "dotenv"
dotenv.config()

// Create transporter using Gmail SMTP (free)
const createTransporter = () => {
  console.log("📧 Creating email transporter with:", {
    user: process.env.EMAIL_USER ? "✓ Set" : "✗ Missing",
    pass: process.env.EMAIL_PASS ? "✓ Set" : "✗ Missing",
  })

  return nodemailer.createTransport({
    // Fixed: createTransport (not createTransporter)
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASS, // Your Gmail app password (not regular password)
    },
    debug: true, // Enable debug logs
    logger: true, // Enable logger
  })
}

// Test email configuration
export const testEmailConfig = async () => {
  try {
    const transporter = createTransporter()
    await transporter.verify()
    console.log("✅ Email configuration is valid")
    return { success: true }
  } catch (error) {
    console.error("❌ Email configuration error:", error.message)
    return { success: false, error: error.message }
  }
}

// Send verification code email
export const sendVerificationCode = async (email, code, name) => {
  try {
    console.log(`📧 Attempting to send verification code to: ${email}`)
    const transporter = createTransporter()

    const mailOptions = {
      from: `"Sajbela Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Verification Code - Sajbela",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e91e63; margin: 0;">সাজবেলা - Sajbela</h1>
            <p style="color: #666; margin: 5px 0;">Your Beauty, Our Priority</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
            <p style="color: #666; margin-bottom: 20px;">Hello ${name},</p>
            <p style="color: #666; margin-bottom: 30px;">
              You requested to reset your password. Use the verification code below to proceed:
            </p>
            
            <div style="background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h1 style="color: #e91e63; font-size: 32px; letter-spacing: 5px; margin: 0;">${code}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              This code will expire in 10 minutes for security reasons.
            </p>
            <p style="color: #666; font-size: 14px;">
              If you didn't request this, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              © 2024 Sajbela. All rights reserved.<br>
              This is an automated email, please do not reply.
            </p>
          </div>
        </div>
      `,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log("✅ Verification email sent successfully:", result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error("❌ Email sending error:", error)
    return { success: false, error: error.message }
  }
}

// Send password reset success email
export const sendPasswordResetSuccess = async (email, name) => {
  try {
    console.log(`📧 Attempting to send password reset success email to: ${email}`)
    const transporter = createTransporter()

    const mailOptions = {
      from: `"Sajbela Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Successful - Sajbela",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #e91e63; margin: 0;">সাজবেলা - Sajbela</h1>
            <p style="color: #666; margin: 5px 0;">Your Beauty, Our Priority</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
            <h2 style="color: #28a745; text-align: center; margin-bottom: 20px;">✓ Password Reset Successful</h2>
            <p style="color: #666; margin-bottom: 20px;">Hello ${name},</p>
            <p style="color: #666; margin-bottom: 20px;">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <p style="color: #666; margin-bottom: 20px;">
              If you didn't make this change, please contact our support team immediately.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/auth/login" 
                 style="background: #e91e63; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Login to Your Account
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              © 2024 Sajbela. All rights reserved.<br>
              This is an automated email, please do not reply.
            </p>
          </div>
        </div>
      `,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log("✅ Password reset success email sent successfully:", result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error("❌ Email sending error:", error)
    return { success: false, error: error.message }
  }
}

// Send beautiful order confirmation email
export const sendOrderConfirmation = async (email, name, order) => {
  try {
    console.log(`📧 Attempting to send order confirmation email to: ${email}`)
    console.log(`📦 Order ID: ${order._id}`)

    const transporter = createTransporter()

    // Format order items for email
    const orderItemsHtml = order.orderItems
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 15px; text-align: left;">
            <div style="display: flex; align-items: center;">
              <img src="${item.image || "/placeholder.svg"}" alt="${item.name}" 
                   style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px;">
              <div>
                <h4 style="margin: 0; color: #333; font-size: 16px;">${item.name}</h4>
                ${item.selectedColor ? `<p style="margin: 5px 0; color: #666; font-size: 14px;">Color: ${item.selectedColor}</p>` : ""}
                ${item.selectedSize ? `<p style="margin: 5px 0; color: #666; font-size: 14px;">Size: ${item.selectedSize}</p>` : ""}
              </div>
            </div>
          </td>
          <td style="padding: 15px; text-align: center; color: #666;">×${item.quantity}</td>
          <td style="padding: 15px; text-align: right; color: #333; font-weight: bold;">৳${item.price}</td>
        </tr>
      `,
      )
      .join("")

    const mailOptions = {
      from: `"Sajbela Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Order Confirmation #${order._id.toString().slice(-8).toUpperCase()} - Sajbela`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #e91e63, #ad1457); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">সাজবেলা - Sajbela</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your Beauty, Our Priority</p>
          </div>

          <!-- Success Message -->
          <div style="background: white; padding: 40px 30px; text-align: center; border-left: 5px solid #28a745;">
            <div style="font-size: 60px; margin-bottom: 20px;">🎉</div>
            <h2 style="color: #28a745; margin: 0 0 15px 0; font-size: 28px;">Order Confirmed!</h2>
            <p style="color: #666; font-size: 18px; margin: 0;">Thank you for your order, ${name}!</p>
            <p style="color: #666; font-size: 16px; margin: 10px 0 0 0;">Your order has been successfully placed and is being processed.</p>
          </div>

          <!-- Order Details -->
          <div style="background: white; padding: 30px; margin-top: 2px;">
            <h3 style="color: #333; margin: 0 0 20px 0; font-size: 22px; border-bottom: 2px solid #e91e63; padding-bottom: 10px;">Order Details</h3>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap;">
              <div style="margin-bottom: 15px;">
                <p style="margin: 0; color: #666; font-size: 14px;">Order Number</p>
                <p style="margin: 5px 0 0 0; color: #333; font-weight: bold; font-size: 16px;">#${order._id.toString().slice(-8).toUpperCase()}</p>
              </div>
              <div style="margin-bottom: 15px;">
                <p style="margin: 0; color: #666; font-size: 14px;">Order Date</p>
                <p style="margin: 5px 0 0 0; color: #333; font-weight: bold; font-size: 16px;">${new Date(order.createdAt).toLocaleDateString("en-GB")}</p>
              </div>
              <div style="margin-bottom: 15px;">
                <p style="margin: 0; color: #666; font-size: 14px;">Payment Method</p>
                <p style="margin: 5px 0 0 0; color: #333; font-weight: bold; font-size: 16px;">${order.paymentMethod}</p>
              </div>
            </div>

            <!-- Order Items -->
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 15px; text-align: left; color: #333; font-weight: bold;">Product</th>
                  <th style="padding: 15px; text-align: center; color: #333; font-weight: bold;">Qty</th>
                  <th style="padding: 15px; text-align: right; color: #333; font-weight: bold;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHtml}
              </tbody>
            </table>

            <!-- Order Summary -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #666;">Subtotal:</span>
                <span style="color: #333; font-weight: bold;">৳${order.itemsPrice}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #666;">Shipping:</span>
                <span style="color: #333; font-weight: bold;">৳${order.shippingPrice}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #666;">Tax:</span>
                <span style="color: #333; font-weight: bold;">৳${order.taxPrice}</span>
              </div>
              <hr style="border: none; border-top: 2px solid #e91e63; margin: 15px 0;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #333; font-size: 18px; font-weight: bold;">Total:</span>
                <span style="color: #e91e63; font-size: 20px; font-weight: bold;">৳${order.totalPrice}</span>
              </div>
            </div>
          </div>

          <!-- Shipping Address -->
          <div style="background: white; padding: 30px; margin-top: 2px;">
            <h3 style="color: #333; margin: 0 0 20px 0; font-size: 22px; border-bottom: 2px solid #e91e63; padding-bottom: 10px;">Shipping Address</h3>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
              <p style="margin: 0 0 8px 0; color: #333; font-weight: bold; font-size: 16px;">${order.shippingAddress.fullName}</p>
              <p style="margin: 0 0 8px 0; color: #666;">${order.shippingAddress.address}</p>
              <p style="margin: 0 0 8px 0; color: #666;">${order.shippingAddress.city}, ${order.shippingAddress.postalCode}</p>
              <p style="margin: 0 0 8px 0; color: #666;">${order.shippingAddress.country}</p>
              <p style="margin: 0; color: #666;">Phone: ${order.shippingAddress.phone}</p>
            </div>
          </div>

          <!-- Delivery Information -->
          <div style="background: white; padding: 30px; margin-top: 2px;">
            <h3 style="color: #333; margin: 0 0 20px 0; font-size: 22px; border-bottom: 2px solid #e91e63; padding-bottom: 10px;">Delivery Information</h3>
            <div style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); padding: 20px; border-radius: 10px; border-left: 5px solid #2196f3;">
              <ul style="margin: 0; padding-left: 20px; color: #333;">
                <li style="margin-bottom: 8px;">📦 Your order is being processed and will be shipped within 1-2 business days</li>
                <li style="margin-bottom: 8px;">🚚 Expected delivery: 2-3 business days from dispatch</li>
                <li style="margin-bottom: 8px;">💰 Cash on Delivery available</li>
                <li style="margin-bottom: 8px;">📞 We'll call you before delivery</li>
              </ul>
            </div>
          </div>

          <!-- Track Order Button -->
          <div style="background: white; padding: 30px; margin-top: 2px; text-align: center;">
            <a href="${process.env.FRONTEND_URL}/account" 
               style="background: linear-gradient(135deg, #e91e63, #ad1457); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3);">
              Track Your Order
            </a>
          </div>

          <!-- Support Section -->
          <div style="background: white; padding: 30px; margin-top: 2px; border-radius: 0 0 15px 15px;">
            <h3 style="color: #333; margin: 0 0 20px 0; font-size: 20px; text-align: center;">Need Help?</h3>
            <div style="text-align: center; background: #f8f9fa; padding: 20px; border-radius: 10px;">
              <p style="margin: 0 0 15px 0; color: #666;">If you have any questions about your order, feel free to contact us:</p>
              <p style="margin: 0 0 10px 0; color: #333;"><strong>📞 Phone:</strong> +8801782-723804</p>
              <p style="margin: 0 0 10px 0; color: #333;"><strong>📧 Email:</strong> support@sajbela.com</p>
              <p style="margin: 0; color: #333;"><strong>🕒 Hours:</strong> 24 hours</p>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 14px; margin: 0 0 10px 0;">
              Thank you for choosing Sajbela - Your trusted beauty partner
            </p>
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2024 Sajbela. All rights reserved.<br>
              This is an automated email, please do not reply directly to this email.
            </p>
          </div>
        </div>
      `,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log("✅ Order confirmation email sent successfully:", result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error("❌ Order confirmation email error:", error)
    return { success: false, error: error.message }
  }
}
