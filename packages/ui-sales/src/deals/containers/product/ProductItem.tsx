import * as compose from 'lodash.flowright';
import { gql } from '@apollo/client';
import ProductItem from '../../components/product/ProductItem';
import React from 'react';
import { graphql } from '@apollo/client/react/hoc';
import { IDeal, IProductData } from '../../types';
import { isEnabled, withProps } from '@erxes/ui/src/utils/core';
import { mutations } from '../../graphql';
import { IUser } from '@erxes/ui/src/auth/types';

type Props = {
  advancedView?: boolean;
  currencies: string[];
  productsData?: IProductData[];
  productData: IProductData;
  duplicateProductItem?: (productId: string) => void;
  removeProductItem?: (productId: string) => void;
  onChangeProductsData?: (productsData: IProductData[]) => void;
  calculatePerProductAmount: (type: string, productData: IProductData) => void;
  updateTotal?: () => void;
  currentProduct?: string;
  onChangeDiscount: (id: string, discount: number) => void;
  dealQuery: IDeal;
  confirmLoyalties?: any;
  currentUser: IUser
};

class ProductItemContainer extends React.Component<Props> {
  constructor(props) {
    super(props);
  }

  render() {
    const { confirmLoyalties } = this.props;

    const confirmLoyalty = variables => {
      confirmLoyalties({ variables });
    };

    const updatedProps = {
      ...this.props,
      confirmLoyalties: confirmLoyalty
    };

    return <ProductItem {...updatedProps} />;
  }
}

export default withProps<Props>(
  compose(
    graphql<Props>(gql(mutations.confirmLoyalties), {
      name: 'confirmLoyalties',
      skip: () => !isEnabled('loyalties')
    })
  )(ProductItemContainer)
);
