import { faSearch } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import React, { useCallback, useState, useEffect } from "react"
import {
  buttonStyle,
  DESKTOP_MIN_WIDTH,
  labelColor,
  media,
  Responsive,
} from "../styles"
import ContentWrapper from "./ContentWrapper"
import ElectionMap from "./ElectionMap"
import { ZoneFilterPanel, ZoneFilterContext } from "./ZoneFilterPanel"
import { ZoneSearchPanel } from "./ZoneSearchPanel"
import { filters } from "../models/information"
import CloseButton from "./CloseButton"
import { keyframes } from "@emotion/core"
import { zones, parties } from "../models/information"
import _ from "lodash"
import ErrorBoundary from "./ErrorBoundary"

/**
 * @param {object} props
 * @param {React.ReactNode} props.contentHeader
 * @param {React.ReactNode} props.contentBody
 * @param {React.ReactNode} props.popup
 */
export default function ZoneMasterView({ contentHeader, contentBody, popup }) {
  const hideOnDesktop = { [media(DESKTOP_MIN_WIDTH)]: { display: "none" } }
  const [activeSidebar, setActiveSidebar] = useState(
    /** @type {'filter' | 'search' | null} */ (null)
  )
  const clearActiveSidebar = useCallback(
    () => setActiveSidebar(null),
    setActiveSidebar
  )

  // @todo #1 Convert this state to the route.
  //  To keep the active filter, we can use query string (`location.search`).
  //  e.g. `/filters/northern?tab=map`.
  const [currentMobileTab, setCurrentMobileTab] = useState(
    /** @type {'summary' | 'map'} */ ("summary")
  )

  // @todo #30 Push realtime result to election map instead of mock data
  const mockElectedParties = [1, 8, 10, 12, 15, 39, 68, 72, 83, 84]
  const [mapZones, setMapZones] = useState([
    // zone
    ...zones.map((zone, i) => {
      return {
        id: `${zone.provinceId}-${zone.no}`,
        partyId: mockElectedParties[_.random(mockElectedParties.length)],
        complete: Math.random() > 0.5,
        show: ((zone.provinceId / 10) | 0) === 5, // hide non- nothern regions
      }
    }),
    // senate
    ..._.range(150).map(i => ({
      id: `pl-${i + 1}`,
      partyId: mockElectedParties[_.random(mockElectedParties.length)],
      complete: Math.random() > 0.5,
      show: true,
    })),
  ])
  const [mapTip, setMapTip] = useState(null)
  useEffect(() => {
    const interval = setInterval(() => {
      setMapZones(_zones => {
        return _zones.map(zone =>
          Math.random() > 0.7
            ? zone
            : {
                ...zone,
                partyId: parties[(Math.random() * parties.length) | 0].id,
              }
        )
      })
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <ContentWrapper>
        <div
          data-hidden={popup ? true : undefined}
          css={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2,
            transition: "0.5s transform",
            "&[data-hidden]": {
              transform: "translateY(120%)",
            },
            ...hideOnDesktop,
          }}
        >
          {renderMobileTabs()}
        </div>
        <div
          css={{
            [media(DESKTOP_MIN_WIDTH)]: { display: "flex" },
          }}
        >
          {/* Main content */}
          <div
            css={{
              position: "relative",
              zIndex: 1,
              margin: "0 auto",
              display: currentMobileTab === "summary" ? "block" : "none",
              [media(DESKTOP_MIN_WIDTH)]: {
                display: "block",
                order: 3,
                width: 320,
                margin: 0,
                padding: 16,
              },
            }}
          >
            {popup ? (
              <Popup>
                <ErrorBoundary name="popup">{popup}</ErrorBoundary>
              </Popup>
            ) : null}

            <div css={{ margin: "10px 0", ...hideOnDesktop }}>
              {renderMobileZoneFilterAndSearch()}
            </div>

            <div css={{ position: "relative" }}>
              <ErrorBoundary name="contentHeader">
                {contentHeader}
              </ErrorBoundary>
              <div
                css={{
                  [media(DESKTOP_MIN_WIDTH)]: {
                    height: 440,
                    overflowX: "hidden",
                    overflowY: "auto",
                    WebkitOverflowScrolling: "touch",
                  },
                }}
              >
                <ErrorBoundary name="contentBody">{contentBody}</ErrorBoundary>
              </div>
            </div>
          </div>

          {/* Filters panel */}
          <div
            css={{
              display: "none",
              [media(DESKTOP_MIN_WIDTH)]: {
                display: "block",
                order: 1,
                margin: "0 0 10px",
                padding: 0,
              },
            }}
          >
            <div css={{ marginTop: 10 }}>
              {
                // @todo #1 Implement and style search button on desktop.
              }
              <button
                css={{ float: "right" }}
                onClick={() => setActiveSidebar("search")}
              >
                Search
              </button>
              <ErrorBoundary name="ZoneFilterPanel">
                <ZoneFilterPanel />
              </ErrorBoundary>
            </div>
          </div>

          {/* Election map */}
          <div
            css={{
              display: currentMobileTab === "map" ? "block" : "none",
              [media(DESKTOP_MIN_WIDTH)]: {
                display: "block",
                order: 2,
                width: 375,
                margin: "10px auto",
              },
            }}
          >
          {mapTip && (
            <div
              css={{
                position: "absolute",
                zIndex: 10,
                padding: 6,
                backgroundColor: "#fff",
                pointerEvents: "none",
                boxShadow: "0 0 4px 0 rgba(0, 0, 0, 0.3)",
                top: mapTip.mouseEvent.clientY + 10,
                left: mapTip.mouseEvent.clientX + 10,
              }}
            >
              <div>เขต {mapTip.zone.data.id}</div>
              <div>พรรคผ่อน</div>
              <div>
                <small>นอนบ้างนะ</small>
              </div>
            </div>
          )}
          <ErrorBoundary name="ElectionMap">
            <ElectionMap
              data={mapZones}
              onInit={map => {
                // console.log('map', map);
              }}
              onZoneMouseenter={(zone, mouseEvent) => {
                setMapTip({ zone, mouseEvent })
                // console.log('zone', zone);
              }}
              onZoneMousemove={(zone, mouseEvent) => {
                setMapTip({ zone, mouseEvent })
                // console.log('zone', zone);
              }}
              onZoneMouseleave={(zone, mouseEvent) => {
                setMapTip(null)
                // console.log('zone', zone);
              }}
              onZoneClick={zone => {
                // console.log('zoneClick', zone)
              }}
            />
          </ErrorBoundary>
          </div>
        </div>
        <Responsive
          breakpoint={DESKTOP_MIN_WIDTH}
          narrow={renderSidebars()}
          wide={renderSidebars()}
        />
      </ContentWrapper>
    </div>
  )

  function renderMobileZoneFilterAndSearch() {
    const boxHeight = 56
    return (
      <div css={{ display: "flex", height: boxHeight, padding: "0 10px" }}>
        <button
          css={{
            ...buttonStyle,
            flex: 1,
            height: boxHeight,
          }}
          onClick={() => setActiveSidebar("filter")}
        >
          <div css={{ padding: "0 15px" }}>
            <div css={{ color: labelColor, fontSize: 12 }}>แสดงผล</div>
            <ZoneFilterContext.Consumer>
              {currentFilterName => {
                const name = filters[currentFilterName].name.th
                return <div css={{ fontSize: 16, fontWeight: 600 }}>{name}</div>
              }}
            </ZoneFilterContext.Consumer>
          </div>
        </button>
        <div css={{ flex: "none", marginLeft: 16, width: boxHeight }}>
          <button
            css={{
              ...buttonStyle,
              width: boxHeight,
              height: boxHeight,
              verticalAlign: "middle",
              textAlign: "center",
              lineHeight: `${boxHeight}px`,
            }}
            onClick={() => setActiveSidebar("search")}
          >
            <span role="img" aria-label="mobile zone search">
              <FontAwesomeIcon icon={faSearch} />
            </span>
          </button>
        </div>
      </div>
    )
  }

  function renderSidebars() {
    return (
      <React.Fragment>
        <FloatingSidebar
          title="ค้นหาเขตเลือกตั้ง"
          active={activeSidebar === "search"}
          onClose={clearActiveSidebar}
          width={300}
        >
          <ErrorBoundary name="ZoneSearchPanel">
            <ZoneSearchPanel
              autoFocus={activeSidebar === "search"}
              onSearchCompleted={clearActiveSidebar}
            />
          </ErrorBoundary>
        </FloatingSidebar>
        <FloatingSidebar
          title="ตัวเลือกแสดงผล"
          active={activeSidebar === "filter"}
          onClose={clearActiveSidebar}
        >
          <ErrorBoundary name="ZoneFilterPanel">
            <ZoneFilterPanel
              autoFocus={activeSidebar === "filter"}
              onFilterSelect={clearActiveSidebar}
            />
          </ErrorBoundary>
        </FloatingSidebar>
      </React.Fragment>
    )
  }

  function renderMobileTabs() {
    // @todo #1 Connect the mobile tabs to routing.
    const menuStyle = {
      width: "50%",
      display: "inline-block",
      verticalAlign: "middle",
      lineHeight: "48px",
      cursor: "pointer",
    }

    const renderTab = (targetTab, text) => (
      <span
        css={{
          ...menuStyle,
          borderTop: currentMobileTab === targetTab ? "2px solid black" : "0px",
        }}
        onClick={() => setCurrentMobileTab(targetTab)}
      >
        {text}
      </span>
    )

    return (
      <div
        css={{
          background: "white",
          textAlign: "center",
          fontSize: 16,
          borderTop: "1px solid #eee",
          height: 48,
          fontWeight: "bold",
        }}
      >
        {renderTab("summary", "สรุปข้อมูล")}
        {renderTab("map", "แผนที่")}
      </div>
    )
  }
}

function FloatingSidebar({ title, children, active, onClose, width = 200 }) {
  return (
    <div
      data-active={active ? true : undefined}
      css={{
        background: "white",
        boxShadow: "1px 0 1px rgba(0,0,0,0.25)",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: width,
        zIndex: 10,
        padding: "0 16px",
        transform: "translateX(-120%)",
        transition: "0.5s transform",
        overflowX: "hidden",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        "&[data-active]": {
          transform: "translateX(0%)",
        },
      }}
    >
      <CloseButton onClick={onClose} />
      <div css={{ marginTop: 10 }}>
        <div css={{ color: labelColor, fontWeight: 600 }}>{title}</div>
        {children}
      </div>
    </div>
  )
}

function Popup({ children }) {
  return (
    <div
      css={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 20,
        background: "#eee",
        animation: `${popup} 0.7s`,
        [media(DESKTOP_MIN_WIDTH)]: {
          position: "absolute",
          animation: "none",
        },
      }}
    >
      {children}
    </div>
  )
}

const popup = keyframes({
  from: {
    transform: "translateY(100%) scale(0.5)",
  },
  "50%": {
    transform: "scale(0.5)",
  },
  to: {
    transform: "translateY(0%)",
  },
})
