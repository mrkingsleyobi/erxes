const fieldsFragment = `
_id
name
type
text
content
description
options
locationOptions{
  lat
  lng
  description
}
objectListConfigs{
  key
  label
  type
}
isRequired
order
validation
associatedFieldId
column
groupId
logicAction
pageNumber
logics {
  fieldId
  logicOperator
  logicValue
}
subFieldIds

`;


export const formDetailQuery = (isProductsEnabled: boolean) => `
  query formDetail($_id: String!) {
    formDetail(_id: $_id) {
      title
      description
      buttonText
      numberOfPages
      googleMapApiKey
      code
      leadData

      fields {
        ${fieldsFragment}
        ${
          isProductsEnabled
            ? `
            products {
              _id
              name
              unitPrice
              attachment {
                url
              }
            }
          `
            : ''
        }
        subFields {
          ${fieldsFragment}
        }
      }
    }
  }
`;

export const formConnectMutation = `
  mutation widgetsLeadConnect($brandCode: String!, $formCode: String!, $cachedCustomerId: String) {
    widgetsLeadConnect(brandCode: $brandCode, formCode: $formCode, cachedCustomerId:$cachedCustomerId) {
      form {
        _id
        title
        description
        leadData
        languageCode
      }
    }
  }
`;

export const saveFormMutation = `
  mutation widgetsSaveLead( $formId: String!, $submissions: [FieldValueInput], $browserInfo: JSON!, $cachedCustomerId: String) {
    widgetsSaveLead(formId: $formId, submissions: $submissions, browserInfo: $browserInfo, cachedCustomerId: $cachedCustomerId) {
      status
      conversationId
      customerId
      errors {
        fieldId
        code
        text
      }
    }
  }
`;

export const sendEmailMutation = `
  mutation widgetsSendEmail($toEmails: [String], $fromEmail: String, $title: String, $content: String, $customerId: String, $formId: String, $attachments: [AttachmentInput]) {
    widgetsSendEmail(toEmails: $toEmails, fromEmail: $fromEmail, title: $title, content: $content, customerId: $customerId, formId: $formId, attachments: $attachments)
  }
`;

export const increaseViewCountMutation = `
  mutation widgetsLeadIncreaseViewCount($formId: String!) {
    widgetsLeadIncreaseViewCount(formId: $formId)
  }
`;

export const generateInvoiceUrl = `
mutation GenerateInvoiceUrl($amount: Float!, $contentType: String, $contentTypeId: String, $customerId: String, $customerType: String, $description: String, $email: String, $paymentIds: [String], $phone: String) {
  generateInvoiceUrl(amount: $amount, contentType: $contentType, contentTypeId: $contentTypeId, customerId: $customerId, customerType: $customerType, description: $description, email: $email, paymentIds: $paymentIds, phone: $phone)
}
`

export const enabledServicesQuery = `
query enabledServices {
  enabledServices
}
`

export const getPaymentMethods = `
query GetPaymentConfig($contentType: String!, $contentTypeId: String!) {
  getPaymentConfig(contentType: $contentType, contentTypeId: $contentTypeId) {
    paymentIds
  }
}
`
