module.exports = function ({ types: t }) {
    return {
      visitor: {
        MemberExpression(path) {
          if (
            t.isMetaProperty(path.node) &&
            path.node.meta.name === 'import' &&
            path.node.property.name === 'meta'
          ) {
            // Mock import.meta.env to simulate the VITE_API_URL
            path.replaceWith(
              t.memberExpression(
                t.identifier('process'),
                t.identifier('env')
              )
            );
          }
        }
      }
    };
  };
  