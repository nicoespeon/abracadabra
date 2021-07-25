class Customer {
  constructor(name, discountRate) {
    this._name = name;
    this._contract = new CustomerContract(dateToday(), discountRate);
    this._setDiscountRate(discountRate);
  }
  get discountRate() {
    return this._contract.discountRate;
  }
  _setDiscountRate(arg) {
    this._contract.discountRate = arg;
  }
  becomePreferred() {
    this._setDiscountRate(this.discountRate + 0.03);
    // other nice things
  }
  applyDiscount(amount) {
    return amount.subtract(amount.multiply(this.discountRate));
  }
}

class CustomerContract {
  constructor(startDate, discountRate) {
    this._startDate = startDate;
    this._discountRate = discountRate;
  }
  get discountRate() {
    return this._discountRate;
  }
  set discountRate(arg) {
    this._discountRate = arg;
  }
}

function dateToday() {}

class Amount {
  constructor(value) {
    this._value = value;
  }
  get value() {
    return this._value;
  }
  multiply(rate) {
    return new Amount(this._value * rate);
  }
  subtract(amount) {
    return new Amount(this._value - amount.value);
  }
}

// ---

describe("Refactor", () => {
  it("set the given discount rate", () => {
    const customer = new Customer("John", 0.1);

    expect(customer.discountRate).toBe(0.1);
  });

  it("increase the discount rate when customer is preferred", () => {
    const customer = new Customer("John", 0.1);
    customer.becomePreferred();

    expect(customer.discountRate).toBe(0.13);
  });

  it("apply discount", () => {
    const customer = new Customer("John", 0.1);

    const discountedAmount = customer.applyDiscount(new Amount(1000));

    expect(discountedAmount.value).toBe(900);
  });
});
