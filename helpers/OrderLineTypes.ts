export default (productTypeId: string) => {
  const digitalProductTypes: any = ['virtual','downloadable']
  const orderLineType: string = (digitalProductTypes.includes(productTypeId)) ? 'digital' : 'physical'
  return orderLineType
}
