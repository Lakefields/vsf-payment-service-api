export default (orderComment: any) => {

  const orderCommentParams = {
    statusHistory: {
      comment: orderComment.order_comment,
      created_at: new Date(),
      is_customer_notified: 0,
      is_visible_on_front: 0,
      parent_id: orderComment.order_id,
      status: orderComment.status

    }
  }   
  return orderCommentParams
}
