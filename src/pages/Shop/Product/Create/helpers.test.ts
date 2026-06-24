import {
  joinImageUrls,
  parseSkuAttributes,
  serializeSkuAttributes,
  splitImageUrls,
} from './helpers';

describe('product create helpers', () => {
  test('serializes sku attributes into backend json string', () => {
    expect(
      serializeSkuAttributes([
        { key: '颜色', value: '红色' },
        { key: '尺码', value: 'XL' },
      ]),
    ).toBe('{"颜色":"红色","尺码":"XL"}');
  });

  test('parses backend specData json into editable attributes', () => {
    expect(parseSkuAttributes('{"颜色":"黑色","尺码":"M"}')).toEqual([
      { key: '颜色', value: '黑色' },
      { key: '尺码', value: 'M' },
    ]);
  });

  test('returns empty attributes for invalid json', () => {
    expect(parseSkuAttributes('not-json')).toEqual([]);
  });

  test('splits and joins image urls', () => {
    expect(splitImageUrls('http://a.jpg, http://b.jpg,,')).toEqual([
      'http://a.jpg',
      'http://b.jpg',
    ]);

    expect(joinImageUrls(['http://a.jpg', '', 'http://b.jpg'])).toBe(
      'http://a.jpg,http://b.jpg',
    );
  });
});
