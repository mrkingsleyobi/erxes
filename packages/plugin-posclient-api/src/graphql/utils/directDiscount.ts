import { IConfigDocument } from '../../models/definitions/configs';
import { IPosUserDocument } from '../../models/definitions/posUsers';
import { IOrderInput } from '../types';

export const checkDirectDiscount = (
  orderInput: IOrderInput,
  config: IConfigDocument,
  posUser: IPosUserDocument
): IOrderInput => {
  const { directDiscount, directIsAmount, items, totalAmount } = orderInput;
  const { adminIds, cashierIds, permissionConfig } = config;
  const output = { ...orderInput, directDiscount: 0 };
  if (
    !directDiscount ||
    !posUser ||
    !isAuthorizedUser(posUser._id, adminIds, cashierIds)
  ) {
    return output;
  }

  const isAdmin = adminIds.includes(posUser._id);
  const staffConfig = permissionConfig[isAdmin ? 'admins' : 'cashiers'];

  if (!staffConfig?.directDiscount) return output;

  const limitPercent = parseFloat(staffConfig?.directDiscountLimit);

  if (isNaN(limitPercent)) return output;

  if ((!directIsAmount && directDiscount > limitPercent) || (directIsAmount && directDiscount > totalAmount / 100 * limitPercent)) {
    throw new Error(
      `Direct discount limit of ${isAdmin ? 'admins' : 'cashiers'} exceeded`
    );
  }

  const discountPercent = directIsAmount ? directDiscount * 100 / totalAmount : directDiscount;
  applyDiscount(items, discountPercent);

  return orderInput;
};

const isAuthorizedUser = (
  userId: string,
  adminIds: string[],
  cashierIds: string[]
): boolean => {
  return cashierIds.concat(adminIds).includes(userId);
};

const applyDiscount = (
  items: IOrderInput['items'],
  directDiscount: number
): void => {
  for (const item of items || []) {
    item.unitPrice = item.unitPrice || 0;

    const discountValue = parseFloat(
      ((item.unitPrice * directDiscount) / 100).toFixed(2)
    );
    item.unitPrice -= discountValue;
    item.discountAmount = discountValue * item.count;
  }
};
