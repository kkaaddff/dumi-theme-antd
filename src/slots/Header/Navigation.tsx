import { MenuFoldOutlined } from '@ant-design/icons';
import { css } from '@emotion/react';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import { Link, useLocale, useLocation, useNavData, useSiteData } from 'dumi';
import { useCallback } from 'react';
import useAdditionalThemeConfig from '../../hooks/useAdditionalThemeConfig';
import useLocaleValue from '../../hooks/useLocaleValue';
import useSiteToken from '../../hooks/useSiteToken';
import { getTargetLocalePath, isExternalLinks } from '../../utils';
import { type IResponsive } from './index';
import { getMoreLinksGroup } from './More';

export interface NavigationProps {
  isMobile: boolean;
  responsive: IResponsive;
}

const useStyle = () => {
  const { token } = useSiteToken();

  const { antCls, iconCls, fontFamily, headerHeight, menuItemBorder, colorPrimary } = token;

  return {
    nav: css`
      height: 100%;
      font-size: 14px;
      font-family: Avenir, ${fontFamily}, sans-serif;
      border: 0;

      &${antCls}-menu-horizontal {
        border-bottom: none;

        & > ${antCls}-menu-item, & > ${antCls}-menu-submenu {
          min-width: (40px + 12px * 2);
          height: ${headerHeight}px;
          padding-right: 12px;
          padding-left: 12px;
          line-height: ${headerHeight}px;

          &::after {
            top: 0;
            right: 12px;
            bottom: auto;
            left: 12px;
            border-width: ${menuItemBorder}px;
          }
        }

        & ${antCls}-menu-submenu-title ${iconCls} {
          margin: 0;
        }

        & > ${antCls}-menu-item-selected {
          a {
            color: ${colorPrimary};
          }
        }
      }

      & > ${antCls}-menu-item, & > ${antCls}-menu-submenu {
        text-align: center;
      }
    `,
    popoverMenuNav: css`
      ${antCls}-menu-item,
      ${antCls}-menu-submenu {
        text-align: left;
      }

      ${antCls}-menu-item-group-title {
        padding-left: 24px;
      }

      ${antCls}-menu-item-group-list {
        padding: 0 16px;
      }

      ${antCls}-menu-item,
      a {
        color: #333;
      }
    `
  };
};

export default function Navigation({ isMobile, responsive }: NavigationProps) {
  const { pathname, search } = useLocation();
  const { locales } = useSiteData();
  const { github, socialLinks } = useAdditionalThemeConfig();

  // 统一使用 themeConfig.nav，使用 useNavData，当存在自定义 pages 时，会导致 nav 混乱
  const navList = useNavData();
  const locale = useLocale();
  const moreLinks = useLocaleValue('moreLinks');
  const activeMenuItems = pathname
    .split('/')
    .map((_, i, arr) => arr.slice(0, i + 1).join('/'))
    .filter(Boolean);

  const extractLinkKey = (link: string | undefined): string => {
    return (link ?? '').split('/').slice(0, 2).join('/');
  };

  const generateLabel = (link: string | undefined, title: string): JSX.Element => {
    if (isExternalLinks(link)) {
      return (
        <a href={`${link}${search}`} target="_blank" rel="noreferrer">
          {title}
        </a>
      );
    }
    return <Link to={`${link}${search}`}>{title}</Link>;
  };

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const menuItems: MenuProps['items'] = (navList ?? []).map(({ link, title, children }) => {
    const linkKeyValue = extractLinkKey(link);

    if (children) {
      const childrens = {
        label: title,
        key: isExternalLinks(link) ? link : linkKeyValue,
        children: children.map((child) => ({
          label: generateLabel(link! + child.link, child.title),
          key: link! + child.link
        }))
      };
      return childrens;
    }
    return {
      label: generateLabel(link, title),
      key: isExternalLinks(link) ? link : linkKeyValue
    };
  });

  // 获取小屏幕下多语言导航栏节点
  const getLangNode = useCallback(() => {
    if (locales.length < 2) {
      return null;
    }
    if (locales.length === 2) {
      const nextLang = locales.filter((item) => item.id !== locale.id)[0];
      const nextPath = getTargetLocalePath({
        current: locale,
        target: nextLang
      });
      return {
        label: (
          <a rel="noopener noreferrer" href={nextPath}>
            {nextLang.name}
          </a>
        ),
        key: nextLang.id
      };
    }
    return {
      label: <span>{locale.name}</span>,
      key: 'multi-lang',
      children: locales
        .filter((item) => item.id !== locale.id)
        .map((item) => {
          const nextPath = getTargetLocalePath({
            current: locale,
            target: item
          });
          return {
            label: (
              <a rel="noopener noreferrer" href={nextPath}>
                {item.name}
              </a>
            ),
            key: item.id
          };
        })
    };
  }, [locale, locales]);

  let additional: MenuProps['items'];
  const additionalItems: MenuProps['items'] = [
    github || socialLinks?.github
      ? {
          label: (
            <a rel="noopener noreferrer" href={github || socialLinks?.github} target="_blank">
              GitHub
            </a>
          ),
          key: 'github'
        }
      : null,
    getLangNode(),
    ...(getMoreLinksGroup(moreLinks) || [])
  ];

  if (isMobile) {
    additional = additionalItems;
  } else if (responsive === 'crowded') {
    additional = [
      {
        label: <MenuFoldOutlined />,
        key: 'additional',
        children: [...additionalItems]
      }
    ];
  }
  const items: MenuProps['items'] = [...(menuItems ?? []), ...(additional ?? [])];
  const menuMode = isMobile ? 'inline' : 'horizontal';
  const style = useStyle();
  return (
    <Menu
      items={items}
      mode={menuMode}
      css={style.nav}
      selectedKeys={[...activeMenuItems]}
      disabledOverflow
    />
  );
}
